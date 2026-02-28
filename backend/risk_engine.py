def calculate_risk(status):
    risk_map = {
        "FAKE_VENDOR_SHELL": 100,
        "DUPLICATE_INVOICE": 98,
        "COMPOSITION_CLAIM": 95,
        "NO_VENDOR": 90,
        "VENDOR_NOT_FILED_GSTR1": 85,
        "MISSING_IRN": 75,
        "HIGH_VALUE_ALERT": 65,
        "PERIOD_MISMATCH": 55,
        "GST_RATE_MISMATCH": 50,
        "MICRO_INVOICE_BURST": 45,
        "MATCHED": 5
    }
    return risk_map.get(status, 30)