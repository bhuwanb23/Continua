# Demo video script (target 1:45, hard limit 2:00)

**Format:** screen recording of the live app plus your voiceover. Record at 1440×900 or 1920×1080, browser zoom 110%, bookmarks bar hidden.
**Tools:** OBS, Loom or the macOS/Windows built-in recorder. Upload to **YouTube as Unlisted** (or Vimeo) and paste the link into Devpost.

| Time | On screen (what you click) | Voiceover (read naturally) |
|---|---|---|
| 0:00–0:12 | Open `/` (**Today**). Hold on the header "80 patients → 42 with verified gaps → 5 prioritized". | "Care coordinators don't lack patient data. They lack time to find what matters across fragmented records. This is Continua." |
| 0:12–0:27 | Slowly scroll the **Review first** cards. Hover one "Verified evidence" tag. | "Sarah manages 80 patients. Continua rebuilt each patient's journey from every source, found 42 with verified continuity gaps, and ranked the five she should review first. This is workflow priority, not a clinical risk score." |
| 0:27–0:47 | Go to **Patients**, then **Maria Chen**. Scroll the **Patient journey** timeline. | "Here's Maria. Her care is spread across primary care, a surgeon, imaging, labs and medications. Continua merges those records into one timeline, and every event links back to its source." |
| 0:47–1:05 | Point at **Oncology follow-up unresolved** on the right. | "After surgery, Maria was referred to oncology within 45 days. That window passed, and there's no completed oncology visit anywhere in her records. No single record is wrong. The gap is between them. Continua turns that into a clear action: verify the referral and coordinate follow-up." |
| 1:05–1:25 | Click **View evidence**. Pause on the claims, the source quote, then the **Absence checks** "0 matches". | "And it shows its work: the exact referral text, the 45-day window from the source, and a search of her records with zero matching visits. If Continua can't verify a claim, it doesn't show the gap at all." |
| 1:25–1:42 | Open **Evaluation**. Hold on the four top metric cards, then scroll to **Baseline comparison**. | "Under the hood, AI only extracts facts. Deterministic rules find the gaps, and an evidence layer verifies every claim. On a held-out synthetic benchmark it scored 1.00 macro F1 and passed all 29 trick cases, where simple keyword rules reached 0.44." |
| 1:42–1:55 | Back to **Today**. | "It runs free, with no database or API keys, so a practice could pilot it this week. Continua: so coordinators spend their time on patients, not on searching charts." |

## Recording tips
- Do one silent screen take first, then record the voiceover over it. It's much easier to hit the timing.
- Move the mouse slowly and pause about 1 second on anything you mention.
- Stay under 2:00. Judges are strict about the 1–2 minute window.
- Don't claim things that aren't on screen (no "saves lives" or "HIPAA-compliant").

## Optional: use the built-in guided demo
`/demo` has the same six scenes with on-screen captions (← → to move between scenes). It's a good fallback if you'd rather present than click around.
