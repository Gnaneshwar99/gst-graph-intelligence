from graph import db

def auto_evaluate_fraud(invoice_id=None):
    """
    Evaluates the compliance of all invoices (or a specific one) and caches the result directly on the Invoice node.
    This makes subsequent querying much faster.
    """
    
    match_clause = "MATCH (t:Taxpayer)-[:CLAIMED_ITC]->(i:Invoice)"
    if invoice_id:
        match_clause = f"MATCH (t:Taxpayer)-[:CLAIMED_ITC]->(i:Invoice {{invoice_id: '{invoice_id}'}})"
        
    query = f"""
    {match_clause}
    OPTIONAL MATCH (i)-[:SUPPLIED_BY]->(v:Vendor)
    
    // Check for duplicate invoice IDs claimed by the same taxpayer
    WITH i, t, v
    OPTIONAL MATCH (t2:Taxpayer)-[:CLAIMED_ITC]->(i2:Invoice {{invoice_id: i.invoice_id}})
    WITH i, v, count(DISTINCT t2) AS duplicate_claims

    WITH i, v, duplicate_claims,
         [(v)-[:FILED]->(g:GSTR1 {{period: i.period}}) | g] AS valid_gstr1s,
         [(v)-[:FILED]->(g2:GSTR1) | g2] AS all_gstr1s,
         [(i)-[:HAS_IRN]->(ir:IRN) | ir] AS irns
         
    WITH i, v, duplicate_claims,
         size(all_gstr1s) AS total_filings,
         size(valid_gstr1s) AS matching_filings,
         size(irns) AS irn_count

    WITH i, v, duplicate_claims, total_filings, matching_filings, irn_count,
    CASE
        WHEN total_filings = 0 AND i.taxable_value > 300000 THEN "FAKE_VENDOR_SHELL"
        WHEN i.taxable_value > 500000 THEN "HIGH_VALUE_ALERT"
        WHEN duplicate_claims > 1 THEN "DUPLICATE_INVOICE"
        WHEN v IS NOT NULL AND v.registration_type = 'Composition' THEN "COMPOSITION_CLAIM"
        WHEN total_filings > 0 AND matching_filings = 0 THEN "PERIOD_MISMATCH"
        WHEN i.gst_rate > 28 OR i.gst_rate <= 0 THEN "GST_RATE_MISMATCH"
        WHEN i.taxable_value < 5000 THEN "MICRO_INVOICE_BURST"
        WHEN v IS NULL THEN "NO_VENDOR"
        WHEN total_filings = 0 THEN "VENDOR_NOT_FILED_GSTR1"
        WHEN irn_count = 0 THEN "MISSING_IRN"
        ELSE "MATCHED"
    END AS status
    
    SET i.risk_status = status
    RETURN status
    """
    
    result = db.run_query(query)
    
    if invoice_id and result:
        return result[0]["status"]
    return result
