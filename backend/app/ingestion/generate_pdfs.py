"""
Generates realistic-looking internal PDF documents for the entertainment company.
These feed into the ChromaDB document retrieval system.
"""
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from app.config import get_settings

settings = get_settings()
PDF_DIR = Path(settings.pdf_data_dir)
PDF_DIR.mkdir(parents=True, exist_ok=True)

BRAND_BLUE = colors.HexColor("#1a3c6e")
BRAND_TEAL = colors.HexColor("#0d9488")
LIGHT_GREY = colors.HexColor("#f1f5f9")


def _base_doc(filename: str, title: str):
    path = PDF_DIR / filename
    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("BrandH1", parent=styles["Heading1"],
                               textColor=BRAND_BLUE, fontSize=18, spaceAfter=6))
    styles.add(ParagraphStyle("BrandH2", parent=styles["Heading2"],
                               textColor=BRAND_BLUE, fontSize=13, spaceAfter=4))
    styles.add(ParagraphStyle("BrandH3", parent=styles["Heading3"],
                               textColor=BRAND_TEAL, fontSize=11, spaceAfter=3))
    styles.add(ParagraphStyle("Body", parent=styles["Normal"],
                               fontSize=9, leading=14, alignment=TA_JUSTIFY))
    styles.add(ParagraphStyle("Caption", parent=styles["Normal"],
                               fontSize=8, textColor=colors.grey, alignment=TA_CENTER))
    return doc, styles, path


def _header_block(styles, title: str, subtitle: str, date: str) -> list:
    return [
        Paragraph(title, styles["BrandH1"]),
        Paragraph(subtitle, styles["BrandH3"]),
        Paragraph(f"Date: {date}  |  Classification: INTERNAL — CONFIDENTIAL", styles["Caption"]),
        HRFlowable(width="100%", thickness=1, color=BRAND_BLUE),
        Spacer(1, 4 * mm),
    ]


def generate_quarterly_report():
    doc, styles, path = _base_doc("quarterly_executive_report.pdf", "Q1 2025 Executive Report")
    story = _header_block(styles,
        "StreamVision Entertainment — Q1 2025 Executive Report",
        "Business Performance Summary | January – March 2025",
        "April 15, 2025")

    story += [
        Paragraph("Executive Summary", styles["BrandH2"]),
        Paragraph(
            "StreamVision delivered strong Q1 2025 results, driven primarily by the exceptional "
            "performance of <b>Stellar Run</b>, which has emerged as the platform's most-watched "
            "title since launch. Total platform views increased 34% year-over-year, while Premium "
            "subscriber conversions grew 18%. The Action and Sci-Fi genres continue to outperform "
            "all others in completion rates and subscriber acquisition. Comedy titles underperformed "
            "relative to their production cost, with Silver Screen and Laugh Track delivering below-"
            "average ratings of 3.2 and 3.0 respectively.",
            styles["Body"]),
        Spacer(1, 4 * mm),

        Paragraph("Content Performance Highlights", styles["BrandH2"]),
        Paragraph(
            "<b>Stellar Run</b> (Action, 2025) recorded 45,230 total views in Q1, making it "
            "the top-performing title by a significant margin. Its completion rate of 82% is "
            "the highest in the current catalogue. Viewer feedback highlights the film's pacing "
            "and visual effects as key satisfaction drivers. The title is trending sharply upward "
            "month-over-month, suggesting strong organic word-of-mouth momentum. Social media "
            "mentions of Stellar Run increased 210% between January and March 2025.",
            styles["Body"]),
        Spacer(1, 2 * mm),
        Paragraph(
            "<b>Dark Orbit</b> (Sci-Fi, 2025) and <b>Last Kingdom</b> (Drama, 2025) rank second "
            "and third respectively. Dark Orbit appeals strongly to the 25–34 male demographic, "
            "while Last Kingdom skews toward female viewers aged 35–54 with notably higher review "
            "scores (avg 4.5). Both titles benefit from strong critical reception and are driving "
            "Premium tier upgrades.",
            styles["Body"]),
        Spacer(1, 2 * mm),
        Paragraph(
            "<b>Comedy underperformance</b> is a key concern. Both Silver Screen and Laugh Track "
            "received ratings below 3.5, which is below the platform average of 3.9. Root cause "
            "analysis suggests misalignment between the target demographic and actual viewership "
            "composition. Comedy titles attract primarily the Free tier, limiting revenue per view. "
            "Marketing spend on comedy titles yielded the lowest ROI across all genres in Q1.",
            styles["Body"]),
        Spacer(1, 4 * mm),

        Paragraph("Geographic Performance", styles["BrandH2"]),
        Paragraph(
            "Mumbai and Bangalore led engagement in Q1 2025, accounting for 28% of total platform "
            "views combined. Mumbai showed the highest revenue per viewer, driven by a "
            "disproportionate share of Premium and Enterprise subscribers. Delhi showed the fastest "
            "growth trajectory with a 41% QoQ increase. Southern cities (Hyderabad, Chennai) are "
            "emerging markets with strong growth potential but currently under-indexed on Premium "
            "conversions. Tier-2 cities (Pune, Bhopal, Nagpur) represent an untapped opportunity "
            "where Free-to-Basic conversion campaigns could yield meaningful subscriber growth.",
            styles["Body"]),
        Spacer(1, 4 * mm),

        Paragraph("Subscriber Metrics", styles["BrandH2"]),
        Paragraph(
            "Total active viewers: 300 (Q1 cohort). Premium tier accounts for 35% of the subscriber "
            "base and 62% of total revenue. The 25–34 age group is the largest and most valuable "
            "segment, with the highest completion rates and the strongest correlation with Premium "
            "upgrades. The 18–24 cohort shows high engagement volume but predominantly on the Free "
            "tier. A targeted conversion campaign for this cohort is recommended as a Q2 priority.",
            styles["Body"]),
        Spacer(1, 4 * mm),

        Paragraph("Q2 2025 Outlook and Recommendations", styles["BrandH2"]),
        Paragraph(
            "Based on Q1 performance trends, leadership should consider the following actions: "
            "(1) Increase content investment in Action and Sci-Fi, which deliver the highest ROI per "
            "production dollar. (2) Pause new comedy commissions until the platform better understands "
            "the genre's monetisation challenges. (3) Launch a targeted subscriber conversion campaign "
            "in Mumbai, Delhi, and Bangalore, where intent signals are strongest. (4) Invest in "
            "original content for the 35–54 female demographic, which drives the highest review scores "
            "and retention rates. (5) Expand marketing spend on Stellar Run during its trending window "
            "to maximise organic momentum.",
            styles["Body"]),
    ]

    doc.build(story)
    return path


def generate_campaign_summary():
    doc, styles, path = _base_doc("campaign_performance_summary.pdf", "Q1 Campaign Summary")
    story = _header_block(styles,
        "Q1 2025 Marketing Campaign Performance Summary",
        "Cross-Channel Campaign Analysis | January – March 2025",
        "April 20, 2025")

    story += [
        Paragraph("Overview", styles["BrandH2"]),
        Paragraph(
            "StreamVision ran 38 discrete campaigns across 6 channels in Q1 2025, with a total "
            "combined spend of approximately ₹42M. Social Media and OTT Native placements delivered "
            "the strongest return on investment. Influencer campaigns for Stellar Run outperformed "
            "all other activations, with a click-through rate 3.2× the platform average.",
            styles["Body"]),
        Spacer(1, 4 * mm),

        Paragraph("Channel Performance", styles["BrandH2"]),
        Table(
            [
                ["Channel", "Total Spend (₹M)", "Avg CTR", "ROI Index"],
                ["Social Media",    "12.4", "6.2%",  "2.4"],
                ["OTT Native",      "9.8",  "5.8%",  "2.1"],
                ["Influencer",      "7.2",  "8.1%",  "3.0"],
                ["Search",          "6.5",  "4.3%",  "1.6"],
                ["Display",         "4.1",  "1.8%",  "0.9"],
                ["Email",           "2.0",  "3.5%",  "1.4"],
            ],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_GREY, colors.white]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
            ]),
            colWidths=[80 * mm, 40 * mm, 30 * mm, 30 * mm],
        ),
        Spacer(1, 4 * mm),

        Paragraph("Comedy Campaign Underperformance", styles["BrandH2"]),
        Paragraph(
            "Campaigns for Silver Screen and Laugh Track significantly underperformed. Despite "
            "combined spend of ₹4.2M, both titles failed to convert viewers at meaningful rates. "
            "Post-campaign analysis indicates the core issue is product-market fit rather than "
            "channel execution — viewers who click comedy ads are engaging briefly but not completing "
            "films or upgrading subscriptions. We recommend a creative strategy review for comedy "
            "before further investment.",
            styles["Body"]),
        Spacer(1, 4 * mm),

        Paragraph("Recommendations", styles["BrandH2"]),
        Paragraph(
            "Reallocate Display budget to Social Media and Influencer activations, which have "
            "consistently outperformed in Q1. Prioritise Stellar Run and Dark Orbit for Q2 "
            "campaign investment given strong organic momentum and premium audience composition. "
            "Consider performance-based influencer agreements tied to subscriber conversion metrics "
            "rather than impression volumes.",
            styles["Body"]),
    ]

    doc.build(story)
    return path


def generate_content_roadmap():
    doc, styles, path = _base_doc("content_roadmap.pdf", "Content Roadmap 2025")
    story = _header_block(styles,
        "StreamVision Content Roadmap — 2025 H2",
        "Strategic Content Investment Plan | Approved April 2025",
        "April 25, 2025")

    story += [
        Paragraph("Strategic Direction", styles["BrandH2"]),
        Paragraph(
            "Following Q1 2025 performance data, the Content Strategy team has approved an "
            "increased allocation toward Action, Sci-Fi, and Drama productions for H2 2025. "
            "This reflects both the strong audience response to existing titles in these genres "
            "and the higher lifetime value of subscribers acquired through such content. "
            "Comedy investments will be restructured, with a focus on premium-tier positioning "
            "rather than broad-audience Free-tier appeal.",
            styles["Body"]),
        Spacer(1, 4 * mm),

        Paragraph("Greenlit Productions — H2 2025", styles["BrandH2"]),
        Paragraph(
            "<b>Project Nova</b> (Action/Sci-Fi): A direct follow-up to Stellar Run leveraging "
            "the established IP. Expected to capitalise on the title's momentum and existing fanbase. "
            "Production starts July 2025; target release December 2025.",
            styles["Body"]),
        Spacer(1, 2 * mm),
        Paragraph(
            "<b>The Quiet Shore</b> (Drama): A critically-positioned drama targeting the 35–54 "
            "female demographic identified as high-value in Q1. Co-production with an international "
            "partner to reduce risk. Target release October 2025.",
            styles["Body"]),
        Spacer(1, 2 * mm),
        Paragraph(
            "<b>Sector 9</b> (Sci-Fi): Standalone science fiction film with high production values "
            "aimed at the 25–34 core demographic. Target release November 2025.",
            styles["Body"]),
        Spacer(1, 4 * mm),

        Paragraph("Comedy Strategy Revision", styles["BrandH2"]),
        Paragraph(
            "Based on Q1 data showing comedy's low ROI and weak completion rates, the roadmap "
            "de-prioritises broad comedy productions. One premium comedy special is planned for "
            "Q4 2025 with a significantly reduced budget, targeting the 18–24 demographic as a "
            "subscriber acquisition mechanism rather than a revenue driver. All future comedy "
            "investments will require a signed distribution agreement before greenlight approval.",
            styles["Body"]),
        Spacer(1, 4 * mm),

        Paragraph("Regional Content Strategy", styles["BrandH2"]),
        Paragraph(
            "Following strong engagement from Mumbai and Southern cities, the roadmap includes "
            "two regional language productions for H2 2025: one Tamil-language thriller targeting "
            "the Chennai and Bangalore markets, and one Marathi drama for the Mumbai/Pune corridor. "
            "These are expected to drive Premium conversion in markets currently under-indexed "
            "relative to their economic potential.",
            styles["Body"]),
    ]

    doc.build(story)
    return path


def generate_policy_guidelines():
    doc, styles, path = _base_doc("policy_guidelines.pdf", "Data & AI Policy")
    story = _header_block(styles,
        "StreamVision Data & AI Usage Policy",
        "Internal Policy Document v2.3 | Effective January 2025",
        "January 1, 2025")

    story += [
        Paragraph("1. Purpose and Scope", styles["BrandH2"]),
        Paragraph(
            "This policy governs the access, processing, and use of internal data assets at "
            "StreamVision Entertainment. It applies to all employees, contractors, and automated "
            "systems that interact with viewer data, financial data, content metadata, and "
            "associated analytics systems.",
            styles["Body"]),
        Spacer(1, 4 * mm),

        Paragraph("2. Data Classification", styles["BrandH2"]),
        Paragraph(
            "<b>Tier 1 — Public:</b> Approved marketing materials, press releases, published metrics. "
            "No restrictions on distribution.",
            styles["Body"]),
        Spacer(1, 2 * mm),
        Paragraph(
            "<b>Tier 2 — Internal:</b> Aggregated business metrics, non-personalised analytics, "
            "content roadmaps. May be shared within the organisation; not to be shared externally "
            "without approval from the Chief Data Officer.",
            styles["Body"]),
        Spacer(1, 2 * mm),
        Paragraph(
            "<b>Tier 3 — Confidential:</b> Individual viewer records, personalised engagement data, "
            "financial projections, unreleased content plans. Access is role-restricted. Must not "
            "be included in AI model context without explicit data minimisation. All queries against "
            "Tier 3 data require audit logging.",
            styles["Body"]),
        Spacer(1, 4 * mm),

        Paragraph("3. AI System Requirements", styles["BrandH2"]),
        Paragraph(
            "AI-powered analytics systems must comply with the following requirements: "
            "(a) All data access must occur through approved, parameterised APIs — no raw database "
            "access for AI inference workloads. (b) Viewer PII must never appear in AI model context. "
            "Aggregated and anonymised summaries are permitted. (c) AI systems must log all tool "
            "invocations including timestamps, query types, and result sizes, without logging "
            "personal data values. (d) AI-generated recommendations must be labelled as AI-generated "
            "and reviewed by a human analyst before distribution to senior leadership.",
            styles["Body"]),
        Spacer(1, 4 * mm),

        Paragraph("4. Prohibited Uses", styles["BrandH2"]),
        Paragraph(
            "The following uses of internal data are expressly prohibited: tracking individual "
            "viewer behaviour for targeted advertising without explicit consent, using AI systems "
            "to make automated HR decisions, sharing internal performance data with external parties "
            "without CDO approval, and using unvetted AI models to process Tier 3 data.",
            styles["Body"]),
    ]

    doc.build(story)
    return path


def generate_audience_behavior_report():
    doc, styles, path = _base_doc("audience_behavior_report.pdf", "Audience Behavior Report")
    story = _header_block(styles,
        "Audience Behavior & Engagement Analysis",
        "Q1 2025 Deep Dive | Data Science Team",
        "April 30, 2025")

    story += [
        Paragraph("Key Findings", styles["BrandH2"]),
        Paragraph(
            "Analysis of 6,000+ watch events in Q1 2025 reveals distinct audience behaviour "
            "patterns across demographic segments. The 25–34 age group accounts for the largest "
            "share of completed views and has the highest correlation with Premium subscription "
            "upgrades following content consumption. Mobile is the dominant viewing device across "
            "all demographics, representing 48% of all sessions.",
            styles["Body"]),
        Spacer(1, 4 * mm),

        Paragraph("Genre-Segment Affinity", styles["BrandH2"]),
        Paragraph(
            "Action and Sci-Fi genres have the strongest affinity with the 18–34 male segment, "
            "with completion rates exceeding 80% for top titles. Drama content resonates most "
            "strongly with female viewers aged 35–54, who also leave the highest average review "
            "scores on the platform. Documentary content skews toward older, higher-income "
            "subscribers who show strong loyalty and the lowest churn rates.",
            styles["Body"]),
        Spacer(1, 2 * mm),
        Paragraph(
            "Comedy has the broadest age distribution but the lowest depth-of-engagement metrics. "
            "Average watch session for comedy titles is 42 minutes versus 78 minutes for drama "
            "and 91 minutes for action. Comedy viewers are also the least likely to leave reviews "
            "or complete films. This pattern suggests comedy serves primarily as a light discovery "
            "channel rather than a retention or monetisation driver.",
            styles["Body"]),
        Spacer(1, 4 * mm),

        Paragraph("Device and Session Patterns", styles["BrandH2"]),
        Paragraph(
            "TV viewing, while accounting for only 22% of sessions, correlates with the highest "
            "completion rates (74%) and the longest average session duration. Premium subscribers "
            "show a 2.1× higher rate of TV-device usage compared to Free tier subscribers. "
            "This suggests TV access may function as a retention signal — subscribers who watch "
            "on TV are more engaged and less likely to churn.",
            styles["Body"]),
        Spacer(1, 4 * mm),

        Paragraph("Trending Analysis: Stellar Run", styles["BrandH2"]),
        Paragraph(
            "Stellar Run exhibits a characteristic viral growth pattern: slow initial uptake in "
            "January, followed by a sharp inflection point in mid-February 2025 coinciding with "
            "organic social media discussion and two high-profile influencer reviews. March 2025 "
            "views exceeded January views by 180%, with no corresponding increase in marketing "
            "spend. The title's word-of-mouth coefficient is estimated at 1.4, meaning each viewer "
            "generates on average 1.4 additional views through recommendation behaviour. This is "
            "the strongest organic growth signal observed in the platform's history.",
            styles["Body"]),
        Spacer(1, 4 * mm),

        Paragraph("Recommendations for Q2 Audience Strategy", styles["BrandH2"]),
        Paragraph(
            "(1) Launch a referral programme targeting Stellar Run's active viewers, leveraging "
            "their demonstrated recommendation behaviour. (2) Design a Comedy genre intervention: "
            "either reposition comedy as a free-tier acquisition funnel explicitly, or commission "
            "a premium comedy format with higher production values targeting an older demographic. "
            "(3) Invest in TV app experience improvements — the device most correlated with "
            "engagement and retention is the most under-served in product development. "
            "(4) Build a dedicated content vertical for the 35–54 female segment, which consistently "
            "produces the highest review scores and strongest completion rates across all genres.",
            styles["Body"]),
    ]

    doc.build(story)
    return path


def generate_all() -> list[Path]:
    from app.utils.logger import get_logger
    log = get_logger("generate_pdfs")

    files = []
    generators = [
        generate_quarterly_report,
        generate_campaign_summary,
        generate_content_roadmap,
        generate_policy_guidelines,
        generate_audience_behavior_report,
    ]
    for gen in generators:
        path = gen()
        files.append(path)
        log.info("Generated PDF", path=str(path))

    return files


if __name__ == "__main__":
    generate_all()
