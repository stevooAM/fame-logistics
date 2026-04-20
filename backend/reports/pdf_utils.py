"""
PDF generation utilities for Fame FMS reports using WeasyPrint (HTML→PDF).
"""

from __future__ import annotations
from datetime import date

_CSS = """
@page {
    size: A4 landscape;
    margin: 15mm 12mm;
    @bottom-right { content: "Page " counter(page) " of " counter(pages); font-size: 9pt; }
    @bottom-left  { content: "Generated: GENERATED_DATE"; font-size: 9pt; }
}
body  { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #2B3E50; }
h1    { font-size: 14pt; color: #1F7A8C; margin-bottom: 4px; }
.meta { font-size: 9pt; color: #555; margin-bottom: 12px; }
table { width: 100%; border-collapse: collapse; }
th    { background: #1F7A8C; color: #fff; padding: 6px 8px; text-align: left; font-size: 9pt; }
td    { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; font-size: 9pt; }
tr:nth-child(even) td { background: #f9fafb; }
.totals-row td { font-weight: bold; background: #f3f4f6; border-top: 2px solid #1F7A8C; }
.section-heading { font-size: 11pt; font-weight: bold; color: #1F7A8C; margin: 16px 0 6px; }
"""

COMPANY_NAME = "Fame Logistics Ltd"


def _fmt_money(val: str) -> str:
    try:
        return f"{float(val):,.2f}"
    except (ValueError, TypeError):
        return val


def generate_report_pdf(
    report_type: str,
    data,
    date_from: date,
    date_to: date,
    currency_code: str | None = None,
) -> bytes:
    """Generate PDF bytes for the given report type."""
    import weasyprint
    from datetime import date as date_cls

    generated_date = date_cls.today().strftime("%d %b %Y")
    period_str = f"{date_from.strftime('%d %b %Y')} \u2014 {date_to.strftime('%d %b %Y')}"
    currency_str = f" | Currency: {currency_code}" if currency_code else ""

    css = _CSS.replace("GENERATED_DATE", generated_date)

    if report_type == "customer-activity":
        title = "Customer Activity Report"
        meta = f"Period: {period_str}"
        html_body = _customer_activity_html(data)
    elif report_type == "job-status":
        title = "Job Status Report"
        meta = f"Period: {period_str}"
        html_body = _job_status_html(data)
    elif report_type == "revenue":
        title = "Revenue Report"
        meta = f"Period: {period_str}{currency_str}"
        html_body = _revenue_html(data)
    else:
        raise ValueError(f"Unknown report_type: {report_type}")

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>{css}</style></head>
<body>
  <h1>{COMPANY_NAME} \u2014 {title}</h1>
  <p class="meta">{meta}</p>
  {html_body}
</body>
</html>"""

    doc = weasyprint.HTML(string=html).render()
    return doc.write_pdf()


def _customer_activity_html(rows: list) -> str:
    if not rows:
        return "<p>No data for the selected period.</p>"
    headers = [
        "Customer", "Total Jobs", "Total Value",
        "Draft", "Pending", "In Progress", "Customs",
        "Delivered", "Closed", "Cancelled",
    ]
    header_row = "".join(f"<th>{h}</th>" for h in headers)
    data_rows = ""
    total_jobs = 0
    total_val = 0.0
    status_totals = {k: 0 for k in ["draft", "pending", "in_progress", "customs", "delivered", "closed", "cancelled"]}
    for r in rows:
        val = float(r.get("total_value", "0") or "0")
        total_jobs += r.get("total_jobs", 0)
        total_val += val
        for k in status_totals:
            status_totals[k] += r.get(k, 0)
        data_rows += f"""<tr>
          <td>{r['customer_name']}</td><td>{r['total_jobs']}</td><td>{_fmt_money(r['total_value'])}</td>
          <td>{r.get('draft', 0)}</td><td>{r.get('pending', 0)}</td><td>{r.get('in_progress', 0)}</td>
          <td>{r.get('customs', 0)}</td><td>{r.get('delivered', 0)}</td><td>{r.get('closed', 0)}</td>
          <td>{r.get('cancelled', 0)}</td>
        </tr>"""
    totals_row = f"""<tr class="totals-row">
      <td>TOTAL</td><td>{total_jobs}</td><td>{total_val:,.2f}</td>
      <td>{status_totals['draft']}</td><td>{status_totals['pending']}</td><td>{status_totals['in_progress']}</td>
      <td>{status_totals['customs']}</td><td>{status_totals['delivered']}</td><td>{status_totals['closed']}</td>
      <td>{status_totals['cancelled']}</td>
    </tr>"""
    return f"<table><thead><tr>{header_row}</tr></thead><tbody>{data_rows}{totals_row}</tbody></table>"


def _job_status_html(rows: list) -> str:
    if not rows:
        return "<p>No data for the selected period.</p>"
    headers = ["Status", "Job Type", "Count", "Total Value"]
    header_row = "".join(f"<th>{h}</th>" for h in headers)
    data_rows = ""
    total_count = 0
    total_val = 0.0
    for r in rows:
        val = float(r.get("total_value", "0") or "0")
        total_count += r.get("count", 0)
        total_val += val
        data_rows += f"""<tr>
          <td>{r['status_label']}</td><td>{r['job_type_label']}</td>
          <td>{r['count']}</td><td>{_fmt_money(r['total_value'])}</td>
        </tr>"""
    totals_row = f"""<tr class="totals-row">
      <td colspan="2">TOTAL</td><td>{total_count}</td><td>{total_val:,.2f}</td>
    </tr>"""
    return f"<table><thead><tr>{header_row}</tr></thead><tbody>{data_rows}{totals_row}</tbody></table>"


def _revenue_html(data: dict) -> str:
    period_rows = data.get("period_rows", [])
    period_totals = data.get("period_totals", {})
    customer_rows = data.get("customer_rows", [])
    customer_totals = data.get("customer_totals", {})

    ph = "".join(f"<th>{h}</th>" for h in ["Period", "Invoiced", "Paid", "Outstanding"])
    p_rows_html = "".join(
        f"""<tr>
          <td>{r['period_label']}</td><td>{_fmt_money(r['invoiced'])}</td>
          <td>{_fmt_money(r['paid'])}</td><td>{_fmt_money(r['outstanding'])}</td>
        </tr>"""
        for r in period_rows
    )
    if period_totals:
        p_rows_html += f"""<tr class="totals-row">
          <td>TOTAL</td>
          <td>{_fmt_money(period_totals.get('invoiced', '0'))}</td>
          <td>{_fmt_money(period_totals.get('paid', '0'))}</td>
          <td>{_fmt_money(period_totals.get('outstanding', '0'))}</td>
        </tr>"""

    ch = "".join(f"<th>{h}</th>" for h in ["Customer", "Invoiced", "Paid", "Outstanding"])
    c_rows_html = "".join(
        f"""<tr>
          <td>{r['customer_name']}</td><td>{_fmt_money(r['invoiced'])}</td>
          <td>{_fmt_money(r['paid'])}</td><td>{_fmt_money(r['outstanding'])}</td>
        </tr>"""
        for r in customer_rows
    )
    if customer_totals:
        c_rows_html += f"""<tr class="totals-row">
          <td>TOTAL</td>
          <td>{_fmt_money(customer_totals.get('invoiced', '0'))}</td>
          <td>{_fmt_money(customer_totals.get('paid', '0'))}</td>
          <td>{_fmt_money(customer_totals.get('outstanding', '0'))}</td>
        </tr>"""

    p_section = (
        f"<p class='section-heading'>Monthly Summary</p><table><thead><tr>{ph}</tr></thead><tbody>{p_rows_html}</tbody></table>"
        if period_rows
        else "<p>No period data.</p>"
    )
    c_section = (
        f"<p class='section-heading'>Revenue by Customer</p><table><thead><tr>{ch}</tr></thead><tbody>{c_rows_html}</tbody></table>"
        if customer_rows
        else "<p>No customer data.</p>"
    )
    return p_section + c_section
