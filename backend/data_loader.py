from faker import Faker
import random
from graph import db

fake = Faker()

def load_mock_data():

    print("Loading Mock Data...")

    # -----------------------
    # 1️⃣ Create Vendors
    # -----------------------
    for i in range(20):
        gstin = f"29ABCDE{i:04d}F1Z5"

        db.run_query("""
        MERGE (v:Vendor {gstin:$gstin})
        SET v.legal_name=$name
        """, {
            "gstin": gstin,
            "name": fake.company()
        })

        # 🔥 Only 80% vendors file GSTR1
        if random.random() > 0.2:
            db.run_query("""
            MATCH (v:Vendor {gstin:$gstin})
            MERGE (g:GSTR1 {return_id:$gstin})
            MERGE (v)-[:FILED]->(g)
            """, {"gstin": gstin})

    # -----------------------
    # 2️⃣ Create Taxpayers
    # -----------------------
    for i in range(20):
        gstin = f"27PQRSX{i:04d}L1Z2"

        db.run_query("""
        MERGE (t:Taxpayer {gstin:$gstin})
        SET t.legal_name=$name
        """, {
            "gstin": gstin,
            "name": fake.company()
        })

    # -----------------------
    # 3️⃣ Create Invoices
    # -----------------------
    for i in range(200):

        invoice_id = f"INV{i:05d}"
        vendor = f"29ABCDE{random.randint(0,19):04d}F1Z5"
        taxpayer = f"27PQRSX{random.randint(0,19):04d}L1Z2"

        # Create Invoice
        db.run_query("""
        MERGE (i:Invoice {invoice_id:$invoice_id})
        SET i.taxable_value=$value,
            i.gst_amount=$gst
        """, {
            "invoice_id": invoice_id,
            "value": random.randint(10000, 100000),
            "gst": random.randint(1000, 10000)
        })

        # Create Relationships
        db.run_query("""
        MATCH (i:Invoice {invoice_id:$invoice_id})
        MATCH (v:Vendor {gstin:$vendor})
        MATCH (t:Taxpayer {gstin:$taxpayer})
        MERGE (i)-[:SUPPLIED_BY]->(v)
        MERGE (t)-[:CLAIMED_ITC]->(i)
        """, {
            "invoice_id": invoice_id,
            "vendor": vendor,
            "taxpayer": taxpayer
        })

        # 🔥 Only 70% invoices have IRN (simulate fraud)
        if random.random() > 0.3:
            db.run_query("""
            MATCH (i:Invoice {invoice_id:$invoice_id})
            MERGE (ir:IRN {irn_id:$invoice_id})
            MERGE (i)-[:HAS_IRN]->(ir)
            """, {"invoice_id": invoice_id})

    print("Mock Data Loaded Successfully")