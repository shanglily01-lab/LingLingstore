# -*- coding: utf-8 -*-
"""Brazil playing cards import cost calculator - NCM 9504.40.00"""

def calc_import(cif: float, freight_usd: float, qty: int, icms: float = 0.18):
    despesas = 180
    afrmm = freight_usd * 0.08
    ii = cif * 0.18
    ipi = (cif + ii) * 0.10
    pis = cif * 0.021
    cofins = cif * 0.0965
    base = cif + ii + ipi + pis + cofins + afrmm + despesas
    icms_base = base / (1 - icms)
    icms_v = icms_base * icms
    total_tax = ii + ipi + pis + cofins + icms_v
    landed_customs = cif + afrmm + despesas + total_tax
    return {
        "cif": cif,
        "ii": ii,
        "ipi": ipi,
        "pis": pis,
        "cofins": cofins,
        "afrmm": afrmm,
        "despesas": despesas,
        "icms": icms_v,
        "total_tax": total_tax,
        "landed_customs": landed_customs,
        "per_deck_customs": landed_customs / qty,
        "tax_pct_of_cif": total_tax / cif * 100,
    }


def logistics_10k():
    return {
        "中国出口报关+港杂": 200,
        "中国内陆拖车费": 120,
        "产地证/检验(如需要)": 80,
        "巴西港 THC/拆箱": 250,
        "桑托斯→圣保罗拖柜/派送": 1200,
        "海外仓卸货+入库": 350,
        "贴标(EAN/FNSKU 约R$0.3/副)": 500,
        "首月仓储": 200,
        "清关行服务费": 400,
    }


scenarios = [
    ("首单试跑 5,000副 · 经济款", 5000, 0.35, 1.2, 150),
    ("首单试跑 8,000副 · 系统示例", 8000, 0.625, 1.6, 240),
    ("标准 10,000副 · 中档", 10000, 0.50, 2.0, 300),
    ("标准 10,000副 · 较好款", 10000, 0.80, 2.0, 300),
    ("扩量 20,000副 · LCL/小FCL", 20000, 0.45, 4.0, 500),
]

print("=" * 60)
print("巴西进口成本测算 · 纸扑克牌 NCM 9504.40.00")
print("税率: II 18% | IPI 10% | PIS 2.1% | COFINS 9.65% | ICMS-SP 18%")
print("=" * 60)

for name, qty, fob_per, cbm, freight in scenarios:
    fob = qty * fob_per
    ins = fob * 0.005
    cif = fob + freight + ins
    r = calc_import(cif, freight, qty)
    log = sum(logistics_10k().values()) * (qty / 10000)
    total = r["landed_customs"] + log
    print(f"\n【{name}】")
    print(f"  采购 FOB:     USD {fob:,.0f}  ({fob_per:.2f}/副)")
    print(f"  体积/运费:    {cbm} CBM · 海运 USD {freight}")
    print(f"  CIF 桑托斯:   USD {cif:,.0f}")
    print(f"  ── 进口税 ──")
    print(f"  II:           USD {r['ii']:,.0f}")
    print(f"  IPI:          USD {r['ipi']:,.0f}")
    print(f"  PIS+COFINS:   USD {r['pis'] + r['cofins']:,.0f}")
    print(f"  ICMS:         USD {r['icms']:,.0f}")
    print(f"  AFRMM+港杂:   USD {r['afrmm'] + r['despesas']:,.0f}")
    print(f"  进口税合计:   USD {r['total_tax']:,.0f}  ({r['tax_pct_of_cif']:.1f}% of CIF)")
    print(f"  清关落地:     USD {r['landed_customs']:,.0f}  ({r['per_deck_customs']:.2f}/副)")
    print(f"  物流+仓配:    USD {log:,.0f}  (按比例)")
    print(f"  ★ 入仓总成本: USD {total:,.0f}  ({total/qty:.2f}/副)")

# Detail 10k standard
qty = 10000
fob = 5000
freight = 300
cif = fob + freight + 25
r = calc_import(cif, freight, qty)
log_items = logistics_10k()
log_total = sum(log_items.values())
full = r["landed_customs"] + log_total
fx = 5.70

print("\n" + "=" * 60)
print("【10,000副 标准档 · 费用明细】")
print("=" * 60)
print("\n一、采购与国际运输 (CIF)")
print(f"  工厂 FOB           USD {fob:,.0f}")
print(f"  海运 LCL ~2CBM     USD {freight}")
print(f"  保险               USD 25")
print(f"  CIF 合计           USD {cif:,.0f}")

print("\n二、巴西进口税 (清关时缴纳)")
for label, val in [
    ("II 18%", r["ii"]),
    ("IPI 10%", r["ipi"]),
    ("PIS 2.1%", r["pis"]),
    ("COFINS 9.65%", r["cofins"]),
    ("ICMS 18% (por dentro)", r["icms"]),
    ("AFRMM 8%×海运费", r["afrmm"]),
    ("港口/报关杂费", r["despesas"]),
]:
    print(f"  {label:22s} USD {val:,.0f}")
print(f"  进口税+杂费小计     USD {r['total_tax'] + r['afrmm'] + r['despesas']:,.0f}")

print("\n三、中国端 + 巴西端物流")
for k, v in log_items.items():
    print(f"  {k:22s} USD {v:,.0f}")
print(f"  物流小计             USD {log_total:,.0f}")

print("\n四、汇总")
print(f"  清关后落地成本       USD {r['landed_customs']:,.0f}  ({r['per_deck_customs']:.2f}/副)")
print(f"  入仓可售总成本       USD {full:,.0f}  ({full/qty:.2f}/副)")
print(f"  相对 FOB 倍数        {full/fob:.2f}x")
print(f"  相对 CIF 倍数        {full/cif:.2f}x")

print("\n五、销售毛利测算 (FX 1 USD = {:.2f} BRL)".format(fx))
cost_brl = full / qty * fx
print(f"  到仓成本             R$ {cost_brl:.2f}/副")
for price in [22, 26, 30, 32]:
    comm = 0.16 * price
    ads = 0.08 * price
    fulfill = 3.50
    profit = price - cost_brl - comm - ads - fulfill
    print(
        f"  售价 R$ {price:2d} → 毛利 R$ {profit:5.2f}/副 ({profit/price*100:4.0f}%)"
    )

print("\n六、首单流动资金 (10,000副)")
print(f"  工厂定金 30%         USD {fob*0.3:,.0f}")
print(f"  工厂尾款 70%         USD {fob*0.7:,.0f}")
print(f"  海运+中国端          USD {freight+320:,.0f}")
print(f"  进口税 (到港前备)    USD {r['total_tax']:,.0f}")
print(f"  拖柜+入仓+清关行     USD {1200+350+400:,.0f}")
print(f"  平台押金/广告预留    USD 1,500")
print(f"  ★ 建议准备           USD {fob*0.3 + r['total_tax'] + freight + 320 + 1200 + 350 + 400 + 1500 + fob*0.7:,.0f}")
