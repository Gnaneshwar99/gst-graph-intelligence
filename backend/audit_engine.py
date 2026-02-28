def generate_audit(invoice_id, status):
    if status == "NO_VENDOR":
        return f"Invoice {invoice_id} is HIGH RISK because no vendor linkage was found."
    else:
        return f"Invoice {invoice_id} appears compliant."