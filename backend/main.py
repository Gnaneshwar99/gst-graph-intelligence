from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from erp_sync_engine import simulate_erp_events_bulk
from fraud_engine import auto_evaluate_fraud
from graph import db
from risk_engine import calculate_risk

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/reconcile")
def reconcile():

    query = """
MATCH (t:Taxpayer)-[:CLAIMED_ITC]->(i:Invoice)
OPTIONAL MATCH (i)-[:SUPPLIED_BY]->(v:Vendor)
OPTIONAL MATCH (v)-[:FILED]->(g:GSTR1)
OPTIONAL MATCH (i)-[:HAS_IRN]->(ir:IRN)

WITH t, i,
     count(DISTINCT v) AS vendor_count,
     count(DISTINCT g) AS filing_count,
     count(DISTINCT ir) AS irn_count

WITH t, i,
CASE
    WHEN vendor_count = 0 THEN "NO_VENDOR"
    WHEN filing_count = 0 THEN "VENDOR_NOT_FILED_GSTR1"
    WHEN irn_count = 0 THEN "MISSING_IRN"
    ELSE "MATCHED"
END AS status

RETURN
t.gstin AS taxpayer,
i.invoice_id AS invoice,
status
"""

    results = db.run_query(query)

    output = []

    for r in results:
        status = r.get("status")
        risk = calculate_risk(status)

        output.append({
            "taxpayer": r.get("taxpayer"),
            "invoice": r.get("invoice"),
            "status": status,
            "risk_score": risk
        })

    return output

from data_loader import load_mock_data

@app.get("/load-data")
def load_data():
    load_mock_data()
    return {"message": "Mock data loaded successfully"}


@app.get("/summary")
def summary():

    query = """
    MATCH (i:Invoice)
    WHERE i.risk_status IS NOT NULL
    RETURN i.risk_status AS status, count(i) AS total
    """

    return db.run_query(query)

@app.get("/high-risk")
def high_risk():

    query = """
    MATCH (t:Taxpayer)-[:CLAIMED_ITC]->(i:Invoice)
    WHERE i.risk_status IS NOT NULL AND i.risk_status <> "MATCHED"
    RETURN t.gstin AS taxpayer,
           i.invoice_id AS invoice,
           i.risk_status AS status
    LIMIT 50
    """

    return db.run_query(query)

@app.get("/vendor-compliance")
def vendor_compliance():

    query = """
    MATCH (v:Vendor)<-[:SUPPLIED_BY]-(i:Invoice)
    
    WITH v,
         count(i) AS total_invoices,
         sum(CASE WHEN i.risk_status IS NOT NULL AND i.risk_status <> 'MATCHED' THEN 1 ELSE 0 END) AS not_filed
         
    RETURN
        v.gstin AS vendor,
        total_invoices,
        not_filed,
        (not_filed * 100.0 / total_invoices) AS risk_score
    ORDER BY risk_score DESC
    LIMIT 50
    """

    return db.run_query(query)

@app.get("/audit/{invoice_id}")
def audit(invoice_id: str):

    query = """
    MATCH (i:Invoice {invoice_id:$invoice_id})
    OPTIONAL MATCH (i)-[:SUPPLIED_BY]->(v:Vendor)
    OPTIONAL MATCH (v)-[:FILED]->(g:GSTR1)
    OPTIONAL MATCH (i)-[:HAS_IRN]->(ir:IRN)

    RETURN
        i.invoice_id AS invoice,
        v.gstin AS vendor,
        g.return_id AS filing,
        ir.irn_id AS irn,
        i.risk_status AS status
    """

    result = db.run_query(query, {"invoice_id": invoice_id})

    if not result:
        return {"error": "Invoice not found"}

    r = result[0]
    status = r.get("status", "MATCHED")

    # Map the advanced 25 Fraud flags to rich AI explanations
    explanations = {
        "FAKE_VENDOR_SHELL": "Critical Alert: Vendor has generated a massive taxable invoice but has absolutely no history of filing GSTR-1 returns. High probability of a shell entity passing fake ITC.",
        "DUPLICATE_INVOICE": "Warning: The exact same Invoice ID has been claimed multiple times across the network. Duplicate ITC claim detected.",
        "COMPOSITION_CLAIM": "Compliance Violation: The supplier is registered under the Composition Scheme and is legally restricted from issuing tax invoices to pass on ITC.",
        "HIGH_VALUE_ALERT": "High Value Anomaly: Invoice exceeds safe threshold. Immediate manual verification of underlying e-way bills and transport documents recommended.",
        "PERIOD_MISMATCH": "Temporal Mismatch: The invoice generation period does not align with the vendor's GSTR-1 filing period. Possible delayed reporting or timing fraud.",
        "GST_RATE_MISMATCH": "Taxonomy Error: The applied GST rate is flagged as anomalous or exceeds the maximum standard 28% slab.",
        "MICRO_INVOICE_BURST": "Pattern Detected: A high frequency of micro-invoices (below ₹5,000) was detected, often used to bypass e-invoicing and e-way bill thresholds.",
        "NO_VENDOR": "No Vendor linked to this invoice. Supplier GSTIN is missing from the master registry.",
        "VENDOR_NOT_FILED_GSTR1": "Vendor has failed to file GSTR-1 for this period. ITC claim is ineligible until vendor compliance.",
        "MISSING_IRN": "Invoice is missing an actively generated IRN (Invoice Reference Number). E-invoicing mandate violated."
    }

    reason = explanations.get(status, "Invoice fully compliant and matched across all nodes.")

    return {
        "invoice": invoice_id,
        "analysis": reason
    }

@app.get("/global-audit")
def global_audit():
    query = """
    MATCH (i:Invoice)
    WHERE i.risk_status <> 'MATCHED'
    OPTIONAL MATCH (i)-[:SUPPLIED_BY]->(v:Vendor)
    OPTIONAL MATCH (v)<-[:FILED_BY]-(t:Taxpayer)
    RETURN 
        i.invoice_id AS invoice_id,
        i.risk_status AS type,
        v.gstin AS vendor,
        t.gstin AS taxpayer,
        i.value AS value
    ORDER BY rand() // Randomize since we aren't storing timestamps yet, simulating a live feed
    LIMIT 100
    """
    results = db.run_query(query)
    
    # Explanations from the Fraud Engine
    explanations = {
        "FAKE_VENDOR_SHELL": "Critical: Vendor generated invoice but holds no GSTR-1 filing history. Shell entity suspected.",
        "DUPLICATE_INVOICE": "Warning: Exact Invoice ID claimed multiple times. Duplicate ITC claim detected.",
        "COMPOSITION_CLAIM": "Violation: Supplier registered under Composition Scheme is restricted from passing ITC.",
        "HIGH_VALUE_ALERT": "Anomaly: Invoice value exceeds safe ML threshold. Manual visual verification required.",
        "PERIOD_MISMATCH": "Mismatch: Invoice generation period does not align with vendor's GSTR-1 timeline.",
        "GST_RATE_MISMATCH": "Tax Error: Applied GST rate exceeds standard 28% maximum slab.",
        "MICRO_INVOICE_BURST": "Pattern: High frequency of micro-invoices (<₹5k) detected to bypass e-way bill laws.",
        "NO_VENDOR": "Critical: Supplier GSTIN missing from master active registry.",
        "VENDOR_NOT_FILED_GSTR1": "Violation: Vendor failed to file GSTR-1. ITC claim ineligible.",
        "MISSING_IRN": "Violation: Invoice is missing an active Invoice Reference Number (IRN)."
    }

    audit_logs = []
    for r in results:
        status = r.get("type", "UNKNOWN_ERROR")
        audit_logs.append({
            "id": r.get("invoice_id"),
            "target": r.get("vendor") or "UNKNOWN_GSTIN",
            "type": status,
            "severity": "CRITICAL" if status in ["FAKE_VENDOR_SHELL", "NO_VENDOR"] else "HIGH",
            "message": explanations.get(status, "Graph anomaly detected during continuous traversal sync."),
            "value": r.get("value", 0),
            "timestamp": "Just Now" # In production, use actual timestamp
        })

    return audit_logs

@app.get("/storyteller/{node_id}")
def storyteller(node_id: str):
    
    if node_id.startswith("LIVEINV-") or node_id.startswith("INV-"):
        query = f"MATCH (i:Invoice {{invoice_id: '{node_id}'}}) RETURN i.risk_status AS status, i.taxable_value AS amount, i.gst_amount AS gst"
        result = db.run_query(query)
        if result:
            status = result[0].get("status", "MATCHED")
            amount = result[0].get("amount", 0)
            gst = result[0].get("gst", 0)
            
            if status == "MATCHED":
                return {"story": f"This node is an Invoice ({node_id}) valued at ₹{amount:,.2f} with ₹{gst:,.2f} in GST. It has successfully passed all multi-hop graph checks and appears to be fully compliant and safe."}
            else:
                return {"story": f"This node is a High-Risk Invoice ({node_id}) valued at ₹{amount:,.2f}. The AI Engine flagged it for '{status}'. This indicates a significant compliance anomaly in the vendor supply chain, and the ITC claim should be blocked pending an audit."}
        return {"story": f"This is an Invoice node ({node_id}). However, its current traversal risk data is unavailable or it has been purged from the active graph."}
        
    elif node_id.startswith("V-"):
        return {"story": f"This is a Vendor node ({node_id}). Vendors supply goods and services. If this node is glowing yellow, it means it is actively engaging in the supply chain. We monitor vendor nodes deeply to ensure they file their returns and don't act as fake shell companies."}
        
    elif node_id.startswith("GSTR1-"):
        return {"story": f"This is a GSTR-1 Filing node ({node_id}). It represents a vendor's official tax return. When linked to a vendor, it acts as mathematical proof of compliance in the graph. Missing GSTR-1 nodes are a critical red flag for fraud."}
        
    else:
        # Assume Taxpayer
        return {"story": f"This node ({node_id}) represents a Taxpayer or Buyer entity. Taxpayers claim Input Tax Credit (ITC) from the invoices they receive. They sit at the root of our graph tree, and their compliance health depends entirely on the vendors they interact with."}

@app.post("/sync-and-evaluate")
def sync_and_evaluate():
    # 1. Simulate Bulk ERP Events directly into Neo4j in one single massive transaction
    events = simulate_erp_events_bulk(250)
    
    # 2. Extract and run Multi-Hop Real-time Risk Evaluation across the entire graph natively
    auto_evaluate_fraud()
    
    return {
        "message": "Live ERP Events Processed and Reconciled",
        "event": events[-1], # return the last event for UI preview
        "risk_status": "Batch Evaluated"
    }

@app.get("/reset-db")
def reset_db():
    db.run_query("MATCH (n) DETACH DELETE n")
    return {"message": "Database cleared"}