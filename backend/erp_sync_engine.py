import random
from graph import db
from datetime import datetime
import uuid

def simulate_erp_events_bulk(count=250):
    events = []
    
    # 1. Generate the Raw Data in Memory (Ultra-fast)
    for _ in range(count):
        invoice_uuid = str(uuid.uuid4())
        invoice_id = f"LIVEINV-{invoice_uuid[:8].upper()}"
        
        is_fake_shell = random.random() < 0.10
        is_high_value = random.random() < 0.15
        is_burst = random.random() < 0.10
        is_composition = random.random() < 0.05
        
        # Ensure safe invoices do not trigger any threshold alerts.
        # Micro Burst (<5000), High Value (>500000), Safe (5000 to 500000)
        taxable_val = random.randint(10000, 250000)
        
        if is_high_value:
            taxable_val = random.randint(600000, 1500000)
        elif is_burst:
            taxable_val = random.randint(100, 4500)
            
        # Ensure safe GST rates (5, 12, 18, 28). GST_MISMATCH is triggered if > 28 or <= 0
        gst_rate = random.choice([5, 12, 18, 28])
        if random.random() < 0.05: # Induce GST mismatch
            gst_rate = 35 

        t_val = float(taxable_val)
        g_rate = float(gst_rate)
        gst_amount = (t_val * g_rate) / 100.0

        vendor_filed = False if is_fake_shell else random.random() > 0.3
        filing_period = "2024-04"
        if vendor_filed and random.random() < 0.1:
            filing_period = "2024-05" 

        has_duplicate = random.random() < 0.1

        event = {
            "invoice_id": invoice_id,
            "vendor_gstin": random.choice([
                "29ABCDE1234F1Z5", "27PQRSX5678L1Z2", "24WXYZR2345G1Z6",
                "36ABCDE9999F1Z7", "33LMNOP4321K1Z3"
            ]),
            "buyer_gstin": "29AAACB2894G1ZP",
            "duplicate_buyer": "33LMNOP4321K1Z3" if has_duplicate else None,
            "taxable_value": t_val,
            "gst_rate": g_rate,
            "gst_amount": gst_amount,
            "period": "2024-04",
            "irn_generated": False if is_fake_shell else random.random() > 0.2,
            "vendor_filed": vendor_filed,
            "filing_period": filing_period,
            "registration_type": "Composition" if is_composition else "Regular"
        }
        events.append(event)

    # 2. Push all 250 records to Neo4j in optimized chunks to prevent timeout
    chunk_size = 50
    for i in range(0, len(events), chunk_size):
        chunk_slice = slice(i, i + chunk_size)
        chunk = events[chunk_slice]
        db.run_query("""
    UNWIND $events AS line
    
    // Core Invoice
    MERGE (i:Invoice {invoice_id: line.invoice_id})
    SET i.taxable_value = line.taxable_value,
        i.gst_rate = line.gst_rate,
        i.gst_amount = line.gst_amount,
        i.period = line.period,
        i.source = 'ERP_LIVE'
        
    // Vendor and Buyer Linkage
    WITH i, line
    MERGE (v:Vendor {gstin: line.vendor_gstin})
    SET v.registration_type = line.registration_type
    MERGE (t:Taxpayer {gstin: line.buyer_gstin})
    MERGE (i)-[:SUPPLIED_BY]->(v)
    MERGE (t)-[:CLAIMED_ITC]->(i)
    
    // Duplicate ITC Claim Fraud Linkage
    WITH i, v, line
    CALL {
        WITH i, line
        WITH i, line WHERE line.duplicate_buyer IS NOT NULL
        MERGE (t2:Taxpayer {gstin: line.duplicate_buyer})
        MERGE (t2)-[:CLAIMED_ITC]->(i)
        RETURN count(*) AS dummy1
    }
    
    // IRN Linkage
    CALL {
        WITH i, line
        WITH i, line WHERE line.irn_generated = true
        MERGE (ir:IRN {irn_id: line.invoice_id})
        MERGE (i)-[:HAS_IRN]->(ir)
        RETURN count(*) AS dummy2
    }
    
    // GSTR1 Filing Linkage
    CALL {
        WITH v, line
        WITH v, line WHERE line.vendor_filed = true
        // Construct return ID directly 
        MERGE (g:GSTR1 {return_id: 'RET-' + line.vendor_gstin + '-' + line.filing_period})
        SET g.period = line.filing_period
        MERGE (v)-[:FILED]->(g)
        RETURN count(*) AS dummy3
    }
    RETURN count(i)
    """, {"events": chunk})

    return events
