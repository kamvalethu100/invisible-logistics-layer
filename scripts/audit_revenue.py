
import sqlite3
import json

db_path = '/home/team/shared/invisible-logistics-layer/backend/database.sqlite'
db = sqlite3.connect(db_path)
db.row_factory = sqlite3.Row

def check_audit():
    deliveries = db.execute('SELECT * FROM deliveries').fetchall()
    payments = db.execute('SELECT * FROM payments').fetchall()
    
    # Create a map of delivery_id to its payments
    payment_map = {}
    for p in payments:
        metadata = json.loads(p['metadata'] or '{}')
        delivery_id = metadata.get('delivery_id')
        if delivery_id:
            if delivery_id not in payment_map:
                payment_map[delivery_id] = []
            payment_map[delivery_id].append(p)
            
    anomalies = []
    
    for d in deliveries:
        did = d['id']
        d_payments = payment_map.get(did, [])
        
        # Check for fee
        fee_paid = any(p['type'] == 'DELIVERY_FEE' for p in d_payments)
        if not fee_paid:
            anomalies.append(f"Delivery {did} (Status: {d['status']}) - NO DELIVERY_FEE record found.")
            
        # Check for earning if delivered
        if d['status'] == 'delivered':
            earning_paid = any(p['type'] == 'EARNING' for p in d_payments)
            if not earning_paid and d['driver_id']:
                anomalies.append(f"Delivery {did} - DELIVERED but NO EARNING record found for driver {d['driver_id']}.")
                
        # Check for refund if cancelled
        if d['status'] == 'cancelled':
            refund_paid = any(p['type'] == 'REFUND' for p in d_payments)
            if not refund_paid:
                anomalies.append(f"Delivery {did} - CANCELLED but NO REFUND record found for business {d['business_id']}.")
                
    if not anomalies:
        print("Audit passed: All deliveries have corresponding payment records.")
    else:
        print(f"Audit failed: Found {len(anomalies)} anomalies:")
        for a in anomalies:
            print(f"  - {a}")

if __name__ == "__main__":
    check_audit()
db.close()
