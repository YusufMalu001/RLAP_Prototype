# RLAP — Radiology + Lab Appointment Platform

## Complete Project Context Document

Prepared for: Mustafa Lokhandwala, Associate Product Manager
Organization: vEngage.ai — India Market Initiative
Reference Client: Vijaya Diagnostics
Status: Product Discovery + Widget Specification Complete — Backend & Admin Portal Pending

> **Note:** This copy was pasted into chat and was truncated by a 50,000-character limit partway
> through Section 8. Section 9 (Glossary) and the tail end of Section 8 are missing. See the
> bottom of this file for what's outstanding.

### Table of Contents

1. Executive Summary
2. The Product Combination: Radiology + Pathology (Lab)
3. Complete User Flows
4. Screen-by-Screen Specification
5. Business Rules & Decision Matrix
6. Integrations Required
7. High-Level Architecture
8. Open Items & Assumptions Requiring Sign-off
9. Glossary

---

## 1. Executive Summary

RLAP (Radiology + Lab Appointment Platform) is a white-label, multi-tenant B2B SaaS product being built by vEngage.ai for the Indian diagnostics market. It allows patients of a diagnostic organization (a standalone lab, a radiology centre, a multi-centre chain, or a hospital) to book radiology scans, laboratory tests, or both together, directly from that organization's own website — without calling the front desk.

**Company:** vEngage.ai, an Australian healthtech company. Its existing product, Olivia AI, automates the radiology front office for the Australian market via conversational AI.

**This Initiative:** RLAP extends that foundation to a broader Indian scope: radiology AND lab/pathology booking, consumer self-service via web and WhatsApp, OCR-based prescription booking, and home sample collection — none of which the Australian product currently covers.

**Paying Customer (B2B):** Diagnostic organizations — standalone labs, radiology centres, multi-centre chains, and hospitals. Vijaya Diagnostics is the primary reference client used throughout this project.

**End User (B2C):** Patients who visit a diagnostic organization's website and want to book an appointment themselves.

**Core Problem Solved:** Most diagnostic providers in India still rely on phone calls and manual, front-desk-driven scheduling. Patients struggle to identify the right test/exam, understand preparation requirements, and coordinate multi-service visits. RLAP digitizes and simplifies this entire journey.

**Differentiation Strategy:** A full-stack combination of the best patient experience, the deepest operational integration with the diagnostic centre's systems, and AI-driven features (OCR, and eventually conversational/voice AI) — not just a booking form.

### 1.1 Business Objectives

- Increase the share of bookings made online instead of by phone.
- Reduce call-centre and front-desk workload.
- Support radiology bookings, laboratory bookings, and combined bookings in one journey.
- Improve patient satisfaction and reduce booking friction.
- Enable white-labelled, multi-tenant SaaS deployment across many diagnostic organizations from one platform.

### 1.2 Target Customers & User Personas

**Target customer organizations:**

- Standalone laboratories
- Radiology centres
- Diagnostic chains (multi-centre)
- Hospitals
- Multi-location healthcare organizations

**User personas interacting with the platform:**

- Patient (primary end user)
- Caregiver (booking on behalf of a patient)
- Reception executive (at the diagnostic centre)
- Centre administrator (manages one centre's catalogue/slots)
- Organization administrator (manages the whole tenant)

### 1.3 Current Project Status

The project has moved from open-ended product discovery into detailed specification for the patient-facing booking widget. As of this document:

- The patient-facing booking widget is fully specified: 33 numbered screens, 25 error/system states, 8 shared dialog components, a complete visual design system, and copy/tone rules — delivered as a build-ready specification.
- A comprehensive QA test-flow and UX review document has been produced, covering happy paths, alternate paths, edge cases, a Nielsen heuristic review, emotional-journey mapping, and accessibility notes.
- A client-facing proposal deck for Vijaya Diagnostics has been built for non-technical senior leadership.
- The backend, database schema, API design, and admin portal are NOT yet designed. A dedicated 1–2 week technical design phase is recommended before any coding begins.

---

## 2. The Product Combination: Radiology + Pathology (Lab)

The single biggest product decision in RLAP is that it does not treat Radiology (scans/imaging) and Laboratory/Pathology (blood and sample-based tests) as two separate products bolted together. Instead, they are two catalogues feeding into one shared booking engine, and the system automatically detects when a patient's needs span both — turning the experience into a single "Combined" booking rather than forcing two separate checkouts.

### 2.1 Why Combine Them

- A single doctor's prescription very often requests both a scan (e.g., an ultrasound) and lab tests (e.g., a lipid profile) in the same visit.
- Vijaya Diagnostics and most Indian diagnostic chains already offer both service types from the same centres — patients expect one booking, one payment, one confirmation.
- vEngage.ai's existing Australian product (Olivia AI) only covers radiology — combining lab into the Indian product is a deliberate scope expansion and a key differentiator for this market.

### 2.2 How the Combination Actually Works

There is no separate "Combined" entry tile on the home screen. Combined booking is a state the cart enters automatically, through any of these three paths:

- **Path A — Start with Radiology, add Lab:** While reviewing the Radiology cart, a cross-sell nudge card appears ("Doctor also mentioned a lab test? Add it here →"). Tapping it opens the Laboratory search; once a lab item is added, the cart becomes a Combined Cart.
- **Path B — Start with Laboratory, add Radiology:** The mirror image of Path A — a nudge card in the Lab cart routes into Radiology search.
- **Path C — Upload Prescription (OCR):** If the uploaded prescription contains both scan and lab-test line items, OCR populates both sides of the cart directly, and the booking is Combined from the first screen the patient sees.

### 2.3 Rules That Govern a Combined Booking

| Rule                       | Behaviour                                                                                                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Centre matching            | A combined booking may only proceed at a single centre that offers BOTH the selected radiology exam(s) AND lab test(s). Centres offering only one of the two are filtered out of the list entirely.                                               |
| No matching centre         | The system shows an empty state with two recovery options: "Split into two bookings" (routes the cart into two separate checkouts, one per service) or "Contact us for help."                                                                     |
| Sample collection mode     | Combined bookings are Centre Visit only. Home Collection is not offered when the cart mixes radiology and lab, since the patient must physically visit the centre for the scan anyway; the lab sample is drawn there in the same visit.           |
| Safety / eligibility check | If the radiology portion includes an MRI or a contrast-based study, the same safety screening (pregnancy, pacemaker, implants, allergies) used in the Radiology-only flow applies once, unaffected by which lab tests are also in the cart.       |
| Preparation instructions   | Both instruction sets are shown together but kept visually separated into two labelled cards (e.g., "For your Lab Test" vs "For your Scan") so fasting instructions for the blood draw are never confused with prep for the scan.                 |
| Scheduling                 | A dual slot-selection screen lets the patient pick sensible, independent times for each service at the same centre (e.g., an early-morning fasting blood draw, followed by a scan later that morning) rather than forcing one single shared time. |
| Checkout                   | One patient identification (OTP) step, one combined booking summary showing both services and their charges, one payment, and one confirmation screen — not two of anything.                                                                      |
| Patients per booking       | Still strictly one patient per booking, same as every other flow — a combined booking does not mean multiple people.                                                                                                                              |

### 2.4 Radiology-only vs Lab-only vs Combined — Quick Comparison

| Aspect                   | Radiology Only              | Laboratory Only                                            | Combined                                                 |
| ------------------------ | --------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| Entry point              | "Radiology" tile or search  | "Laboratory" tile or search                                | Cross-sell nudge from either cart, or OCR detecting both |
| Home Collection option   | Not applicable              | Yes, where eligible                                        | No — centre visit only                                   |
| Centre filter            | Offers the selected exam(s) | Offers lab capability (or serviceable for home collection) | Offers BOTH radiology and lab at one centre              |
| Safety/eligibility check | Yes, if MRI/contrast        | Not applicable                                             | Yes, if MRI/contrast (same rule)                         |
| Slot selection           | Single slot                 | Single slot (or collection window if home collection)      | Dual, independent slots at the same centre               |
| Preparation instructions | One instruction set         | One instruction set                                        | Two instruction sets, shown separately                   |
| Checkout / confirmation  | Single                      | Single                                                     | Single — one summary, one payment, one confirmation      |

---

## 3. Complete User Flows

This section documents every flow in the product end to end, step by step, including the alternate and error paths.

### 3.1 Master Flow (Entry Point)

The Master Flow is the router that every patient session starts from.

1. Patient opens the booking platform (embedded widget on the diagnostic organization's website, triggered by a "Book Now" button).
2. Home/entry screen loads: persistent search bar + three entry tiles — Radiology, Laboratory, Upload Prescription.
3. Patient can also reach Download Reports or FAQs from this screen (handled outside the booking widget, e.g., via chatbot).
4. Based on the tile tapped, the patient is routed into the Radiology Flow, Laboratory Flow, or OCR Flow.
5. Typing directly into the search bar (3+ characters) skips the tile choice entirely and adds a matched result straight to the relevant cart.

### 3.2 Radiology Flow

Full step-by-step path for booking a scan/imaging exam:

1. Patient selects "Radiology" from the entry screen.
2. Browse by modality (Ultrasound, X-Ray, CT, MRI, ECG) OR search directly by exam name.
3. If browsing: select a body-part category (Head & Neck, Chest & Cardiac, Abdomen & Pelvis, Spine, Upper Limb, Lower Limb, Whole Body).
4. Select the exact exam from the filtered list (or use free text if not listed).
5. Exam is added to the Radiology cart. Patient may add more exams, or accept a nudge to add a lab test (which converts the booking to Combined).
6. Patient sets location — either "Use my current location" (geolocation) or manually pick City → Area.
7. Centre list is shown, filtered to only centres offering every exam currently in the cart.
8. If the exam is MRI or contrast-based, a safety/eligibility questionnaire appears (pregnancy, pacemaker, implants, allergies). A flagged answer blocks online slot confirmation and routes the patient to a callback/phone request instead.
9. Preparation instructions relevant to the selected exam(s) are shown (e.g., "full bladder required").
10. Patient selects a date and an available time slot; the slot is held for 10 minutes with a visible countdown.
11. Patient verifies identity via mobile number + OTP.
12. System checks for an existing patient record against that mobile number — pre-fills details if found, or opens a blank patient details form if not.
13. Patient details are confirmed/entered (Name, DOB/Age, Gender; Email optional).
14. Booking summary is shown: exam(s), centre, date/time, patient name, price breakdown.
15. Patient chooses payment method — Pay Online Now (primary, dominant option) or Pay at Reception (small secondary option, only shown if every cart item is eligible).
16. Payment is completed (UPI / Card / Net Banking) or booking proceeds directly if pay-at-reception was chosen.
17. Booking Confirmation screen displays Booking ID, appointment details, and preparation reminders.
18. SMS, email, and WhatsApp confirmations are triggered automatically.

### 3.3 Laboratory Flow

Full step-by-step path for booking lab/pathology tests, including the Home Collection sub-flow:

1. Patient selects "Laboratory" from the entry screen.
2. Browse test categories/packages OR search directly by test name.
3. Patient can view a test/package's detail (description, preparation notes, price) before adding it.
4. Test(s)/package(s) added to the Lab cart. Multiple tests can be added; a nudge card offers adding a radiology exam (converts booking to Combined).
5. Patient chooses sample collection type: Home Sample Collection or Visit the Centre.

**Home Collection sub-flow:**

- a. Patient enters PIN code; system validates it against the serviceable catchment area for that test/centre.
- b. If serviceable: patient enters full address (house/flat no., street, landmark); a "Home Collection Service Charge" line item is automatically added to the bill.
- c. If not serviceable: an error state appears ("This PIN isn't serviceable for home collection yet") with a button to fall back to "Visit the Centre" instead, which routes into the centre-selection path below.

**Visit the Centre path:**

- a. Patient sets/uses location (city/area or geolocation).
- b. Centre list shown, filtered to centres offering the tests in the cart.

6. Preparation instructions specific to the selected test(s) are shown (e.g., "10–12 hours fasting required").
7. Patient selects a date and time slot (or, for home collection, a collection time window such as "7:00–8:00 AM").
8. Patient identification via mobile number + OTP, same as the Radiology flow.
9. Patient details confirmed/entered.
10. Booking summary shown, including the home-collection charge if applicable.
11. Payment method selected and completed (or pay-at-reception if eligible).
12. Booking confirmation shown, including collector arrival window (for home collection) and a note to keep prescription/ID ready.
13. SMS, email, and WhatsApp confirmations sent.

### 3.4 Combined Flow

A combined booking reuses the same screen types as the two flows above, merged into one sequence:

1. Patient's cart contains both radiology exam(s) and lab test(s), via cross-sell nudge or OCR.
2. Combined cart screen shows two clearly separated sections (Radiology / Laboratory) with a shared subtotal, plus a notice that the lab sample will be collected at the centre (no home collection).
3. Shared location step, then a centre list filtered to centres offering everything in the cart.
4. If no single centre matches: empty state offers "Split into two bookings" or "Contact Support."
5. Safety/eligibility check if MRI/contrast is present.
6. Combined preparation instructions shown as two separate labelled cards (Lab / Scan).
7. Dual, independent slot selection at the same centre.
8. Mobile/OTP verification, patient details, one combined booking summary, one payment, one confirmation — identical mechanics to the single-service flows.

### 3.5 OCR / Upload Prescription Flow

1. Patient selects "Upload Prescription" from the entry screen (or taps "Upload Referral" from within the Radiology search screen).
2. Patient takes a photo or uploads a file of the prescription.
3. Processing/loading state is shown while OCR extracts text (a few seconds).
4. On success: extracted items are merged directly into the normal cart screen (Radiology cart, Lab cart, or Combined cart, depending on what was detected) — there is no separate "review" screen.
   - High-confidence matches appear as normal cart rows tagged "From prescription."
   - Low-confidence matches are visually flagged (amber outline) and prompt the patient to confirm or correct via search.
   - Any line the system could not match at all appears as plain text with a "Search & Add" prompt rather than being silently dropped.
5. On total failure to read the prescription: a fallback screen appears ("We couldn't quite read that prescription") with two options — "Search Manually" or "Try Uploading Again."
6. From this point on, the OCR-originated cart proceeds through the exact same location → centre → prep → slot → OTP → details → payment → confirmation sequence as a manually built cart.

### 3.6 Patient Identification Flow (Shared Across All Bookings)

- Patient enters a 10-digit mobile number; taps "Send OTP."
- 6-digit OTP entry with auto-advance between boxes; "Verify & Continue" button.
- Incorrect OTP: inline error, retry allowed, no lockout in v1.
- "Resend OTP" is disabled for 30 seconds (shown as a countdown), then becomes active.
- On successful verification, the system searches for an existing patient record tied to that mobile number.
- Match found: patient details screen opens pre-filled and editable, with a "Not you? Enter new details" link.
- No match: patient details screen opens blank.
- The slot hold countdown (started earlier) remains visible throughout this entire identification step.

### 3.7 Report Download Flow

- Patient enters mobile number on the Report Download screen.
- OTP verification (mandatory before any report can be shown).
- System displays the list of completed bookings/reports tied to that verified mobile number.
- Patient selects and downloads a report (and invoice, where available).
- Reports are only available after the underlying service has been completed — not before.

### 3.8 WhatsApp Chatbot Flow (Conversational Channel)

A parallel booking channel, using the same underlying booking engine and business rules, exposed as a conversational flow:

1. Welcome message (triggered by a floating chatbot icon on the website, or directly within WhatsApp).
2. Main menu presented.
3. Service selection (Radiology / Laboratory).
4. Test/exam discovery (conversational search).
5. Cart summary.
6. Slot selection.
7. Patient details collection.
8. OTP verification.
9. Booking confirmation, sent back via SMS/WhatsApp.

Voice call booking is noted as a planned channel alongside WhatsApp, following the same underlying flow logic, positioned as a fast-follow after the web and WhatsApp channels are live.

### 3.9 Error & Edge-Case Flows

| Scenario                                                                       | System Behaviour                                                                                                                               |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Invalid OTP entered                                                            | Inline error shown; further progress blocked until a correct OTP is entered; retry is allowed.                                                 |
| OTP expired                                                                    | Patient must request a new OTP; the old one is invalidated immediately once a new one is generated.                                            |
| Slot hold expires (10 min)                                                     | Patient is returned to slot selection with a message that the hold has lapsed; must reselect.                                                  |
| No centre matches selected items (Radiology/Lab)                               | Empty state shown; patient is offered to broaden the search or contact support.                                                                |
| No single centre matches a Combined cart                                       | Empty state offers "Split into two bookings" or "Contact Support."                                                                             |
| Safety/eligibility check flagged (e.g., pacemaker + MRI)                       | Online slot confirmation is blocked; patient is routed to a callback/phone request instead of a silent failure.                                |
| Home Collection PIN not serviceable                                            | Error state shown with a one-tap option to fall back to "Visit the Centre" instead.                                                            |
| OCR cannot read the prescription at all                                        | Fallback screen offers "Search Manually" or "Try Uploading Again"; no dead end.                                                                |
| Mixed cart with a prepaid-only item alongside a pay-at-reception-eligible item | The entire booking becomes prepaid-only; pay-at-reception is removed as an option for the whole cart, not partially applied.                   |
| Payment failure                                                                | Patient is returned to the payment step to retry; booking is not confirmed until payment (or an eligible pay-at-reception selection) succeeds. |
| General system error                                                           | A friendly error message is shown with the option to retry, rather than a raw failure.                                                         |
| Mandatory field skipped (e.g., patient details)                                | System blocks progression until all mandatory fields are valid.                                                                                |

---

## 4. Screen-by-Screen Specification

Every screen in the widget is documented below with its purpose, fields, buttons, validation rules, and where it navigates to. Screen IDs (e.g., R4, L5a, C2) match the internal specification and QA documents for full traceability.

### 4.1 Information Architecture — Full Screen Map

| ID  | Screen                              | Flow                                   | Enters From             | Exits To                                 |
| --- | ----------------------------------- | -------------------------------------- | ----------------------- | ---------------------------------------- |
| G0  | Entry / Home                        | All                                    | "Book Now" trigger      | R1, L1, O1, or direct-search result      |
| R1  | Radiology Browse (Modality)         | Radiology                              | G0 tile / search miss   | R2 or direct item → R4                   |
| R2  | Body Part — Category                | Radiology                              | R1                      | R3                                       |
| R3  | Body Part — Item Selection          | Radiology                              | R2                      | R4                                       |
| R4  | Radiology Cart                      | Radiology                              | R3 / search / O3        | R5, or L1 (nudge)                        |
| R5  | City / Location Capture             | Radiology, Lab, Combined               | R4, L3, C1              | R6                                       |
| R6  | Centre Selection                    | Radiology                              | R5                      | R7 or R8 or R9                           |
| R7  | Safety & Eligibility Check          | Radiology, Combined (conditional)      | R6 / C2                 | R8 or callback exit                      |
| R8  | Preparation Instructions            | Radiology, Lab, Combined (conditional) | R6/R7, L5b/L6, C2/C3    | R9                                       |
| R9  | Slot Selection                      | Radiology                              | R8                      | SC4 (OTP)                                |
| L1  | Lab Browse (Categories)             | Lab                                    | G0 tile / search miss   | L2 (optional) / L3                       |
| L2  | Test/Package Detail                 | Lab                                    | L1                      | L3                                       |
| L3  | Lab Cart                            | Lab                                    | L1/L2 / search / O3     | L4, or R1 (nudge)                        |
| L4  | Sample Collection Type              | Lab                                    | L3                      | L5a or L5b                               |
| L5a | Home Address & PIN Validation       | Lab                                    | L4                      | L6 (if valid) or L5b (fallback)          |
| L5b | Centre Selection (Lab)              | Lab                                    | R5 / L4 / L5a fallback  | L6                                       |
| L6  | Preparation Instructions (Lab)      | Lab (conditional)                      | L5a/L5b                 | L7                                       |
| L7  | Slot Selection (Lab)                | Lab                                    | L6                      | SC4 (OTP)                                |
| C1  | Combined Cart                       | Combined                               | R4 or L3 nudge accepted | R5                                       |
| C2  | Centre Selection (Combined)         | Combined                               | R5                      | C3/C4/empty-state                        |
| C3  | Safety & Eligibility Check          | Combined (conditional)                 | C2                      | C4 or callback exit                      |
| C4  | Preparation Instructions (Combined) | Combined                               | C2/C3                   | C5                                       |
| C5  | Dual Slot Selection                 | Combined                               | C4                      | SC4 (OTP)                                |
| O1  | Upload Prescription                 | OCR                                    | G0 tile                 | O2                                       |
| O2  | Processing State                    | OCR                                    | O1                      | O3 or O4                                 |
| O3  | Extracted Items (inline in cart)    | OCR                                    | O2                      | R4 / L3 / C1                             |
| O4  | OCR Failure Fallback                | OCR                                    | O2                      | G0 (manual search)                       |
| SC1 | Persistent Search & Browse Header   | All (shared component)                 | G0, R1, L1              | Adds directly to R4 or L3                |
| SC4 | Mobile & OTP Verification           | All                                    | R9 / L7 / C5            | SC5                                      |
| SC5 | Patient Details                     | All                                    | SC4                     | SC6                                      |
| SC6 | Booking Summary & Payment Method    | All                                    | SC5                     | SC7 or direct confirm (pay-at-reception) |
| SC7 | Payment (Online)                    | All                                    | SC6                     | SC8                                      |
| SC8 | Booking Confirmation                | All                                    | SC7 / SC6               | Close, or "Book Another" → G0            |

### 4.2 Detailed Screen Specifications

**G0 — Entry / Home Screen**

- Purpose: Single entry point for all patient journeys, opened as a centered modal over the diagnostic centre's website when the patient clicks "Book Now."
- Fields / Content: vEngage/organization logo, persistent search bar (SC1) with popular-test chips, three large entry tiles: Radiology, Laboratory, Upload Prescription.
- Buttons: Radiology tile, Laboratory tile, Upload Prescription tile, close (✕).
- Validation Rules: All actions remain enabled at all times; no location or catalogue browsing happens here — purely a router plus shortcut search.
- Navigation: Radiology tile → R1. Laboratory tile → L1. Upload Prescription → O1. Typing 3+ characters in search and selecting a result → adds directly to R4 or L3, skipping browse screens.

**SC1 — Persistent Search & Browse Header (shared component)**

- Purpose: Always-available search so a patient can jump straight to what they need without navigating menus.
- Fields / Content: Full-width search input (placeholder: "Search for scans, tests or health checkups…"), horizontally scrollable "Popular" chips (e.g., USG Abdomen, CBC, MRI Brain, Lipid Profile).
- Buttons: None beyond the search field itself; results appear as the patient types.
- Validation Rules: Minimum 3 characters required to trigger results. Searches across both radiology exams and lab tests simultaneously; results are labelled by type ("Scan" / "Test" badge).
- Navigation: Selecting a result adds it directly to the relevant cart (R4 or L3), skipping intermediate browse screens. Present on G0, R1, L1; reachable as a collapsible icon within R2–R3/L2 for re-search.

**R1 — Radiology Browse (Modality)**

- Purpose: Lets a patient who doesn't know the exact exam name browse by machine/modality type.
- Fields / Content: Grid of modality tiles: Ultrasound, X-Ray, CT Scan, MRI, ECG (placeholder catalogue — to be replaced with real data).
- Buttons: Modality tiles, Back.
- Validation Rules: Shown only when browsing (not triggered by direct search). Typing a specific exam name in search skips directly to R4.
- Navigation: Modality tile selected → R2.

**R2 — Body Part — Category**

- Purpose: Narrows the exam list down by body region so the patient doesn't scroll every exam a modality offers.
- Fields / Content: Grid of category tiles: Head & Neck, Chest & Cardiac, Abdomen & Pelvis, Spine, Upper Limb, Lower Limb, Whole Body.
- Buttons: Category tiles, Back.
- Validation Rules: Shown only after a modality has been chosen via browsing.
- Navigation: Category selected → R3.

**R3 — Body Part — Item Selection**

- Purpose: Lets the patient pick the exact exam prescribed by their doctor.
- Fields / Content: List of specific exams within the chosen modality/category (e.g., USG Abdomen, USG Whole Abdomen, USG KUB, USG Pelvis), plus a free-text field for anything not listed.
- Buttons: "+" add button per row, "Search" button for free text, floating cart pill once an item is added, Continue, Back.
- Validation Rules: At least one exam must be added before Continue activates. Multiple items can be added in sequence.
- Navigation: Item added → R4. "Add another exam" returns to R1.

**R4 — Radiology Cart**

- Purpose: Lets the patient review everything selected so far before moving to centre/scheduling.
- Fields / Content: List of added exams with remove (✕) per row, cross-sell nudge card ("Doctor also mentioned a lab test? Add it here").
- Buttons: Remove (✕) per item, "+ Add another exam," nudge card CTA, Continue, Back.
- Validation Rules: Cart cannot be empty to continue.
- Navigation: Continue → R5. Nudge card tapped → opens L1; once a lab item is added the booking becomes Combined (C1) going forward.

**R5 — City / Location Capture (shared across Radiology, Lab, Combined)**

- Purpose: Finds a centre near the patient without making them guess which branch to pick.
- Fields / Content: "Use my current location" (geolocation) option, or manual "Select City" → "Select Area" dropdowns.
- Buttons: "Use My Current Location," city/area dropdowns, Continue, Back.
- Validation Rules: Continue disabled until a location path is completed (either geolocation succeeds or city+area are both selected).
- Navigation: Geolocation success → skips directly to centre selection (R6/L5b/C2) with nearest centres pre-sorted. Manual path → same destination once both dropdowns are filled.

**R6 — Centre Selection (Radiology)**

- Purpose: Shows only centres that can actually fulfil the current cart, so the patient doesn't waste time on ones that can't.
- Fields / Content: List of centre cards: name, address, distance, rating (if available), centre-specific notes.
- Buttons: Centre card selection, Back.
- Validation Rules: List is filtered server-side to centres offering ALL items currently in the radiology cart. Zero matches → empty state suggesting split booking or contact support.
- Navigation: Centre selected → R7 (if MRI/contrast present) or R8 or R9.

**R7 / C3 — Safety & Eligibility Check**

- Purpose: Screens out unsafe scans before they're booked online (e.g., a pacemaker patient booking an MRI).
- Fields / Content: Questionnaire covering pregnancy, pacemaker, implants, and known allergies — triggered only when the cart contains an MRI or contrast-based study.
- Buttons: Answer options per question, Continue, Back.
- Validation Rules: Any flagged (risk) answer blocks online slot confirmation and routes the patient to a callback/phone-request path instead of continuing online.
- Navigation: All-clear → R8/C4. Flagged answer → callback/phone-request exit screen.

**R8 / L6 / C4 — Preparation Instructions**

- Purpose: Ensures the patient shows up correctly prepared (e.g., fasting, full bladder) so the appointment isn't wasted.
- Fields / Content: Exam/test-specific instruction text (e.g., "Lipid Profile — 10–12 hours fasting required"; "USG Pelvis — arrive with a full bladder"). In Combined bookings (C4), lab and scan instructions are shown as two separate labelled cards.
- Buttons: Continue, Back.
- Validation Rules: Shown after centre selection, before slot selection, per business rule.
- Navigation: Continue → R9 / L7 / C5 (slot selection).

**R9 / L7 — Slot Selection**

- Purpose: Lets the patient pick an actual appointment (or, for home collection, a collection window) and locks it in temporarily.
- Fields / Content: Calendar/date picker, list of available time-slot chips (or collection windows like "7:00–8:00 AM" for home collection).
- Buttons: Date selector, time-slot chips, Continue, Back.
- Validation Rules: Unavailable slots cannot be selected. Date and time slot are both mandatory. Selected slot is held for 10 minutes with a visible countdown chip in the header from this point forward.
- Navigation: Continue → SC4 (Mobile & OTP Verification).

**L1 — Laboratory Browse (Categories)**

- Purpose: Lets the patient browse lab tests/packages by category if they don't know exact test names.
- Fields / Content: Test categories, curated packages, individual tests list.
- Buttons: Category/package/test selection, Back.
- Validation Rules: Typing a specific test name in search skips directly to L3.
- Navigation: Item selected → L2 (optional detail view) or directly to L3.

**L2 — Test / Package Detail**

- Purpose: Lets the patient understand exactly what a test/package includes before committing.
- Fields / Content: Test/package description, included parameters, preparation notes, price.
- Buttons: Add to Cart, Back.
- Validation Rules: None beyond a valid item being displayed.
- Navigation: Add to Cart → L3.

**L3 — Laboratory Cart**

- Purpose: Lets the patient review all selected tests/packages before choosing how the sample will be collected.
- Fields / Content: List of selected tests with remove (✕) per row, subtotal, cross-sell nudge card for radiology.
- Buttons: Remove (✕) per item, nudge card CTA, Continue, Back.
- Validation Rules: At least one test must be selected before Continue activates.
- Navigation: Continue → L4. Nudge card tapped → opens R1; booking becomes Combined (C1) once a radiology item is added.

**L4 — Sample Collection Type**

- Purpose: Lets the patient choose between a technician visiting them or visiting the centre themselves.
- Fields / Content: Two large option cards: "Home Sample Collection" and "Visit the Centre."
- Buttons: Card selection (advances automatically on tap), Back.
- Validation Rules: None — selecting a card advances directly to the corresponding path.
- Navigation: Home Sample Collection → L5a. Visit the Centre → R5 (location) → L5b.

**L5a — Home Address & PIN Validation**

- Purpose: Confirms quickly whether home collection is actually available at the patient's address before asking for full details.
- Fields / Content: PIN code field, then (on success) address fields: House/Flat No., Street/Locality, Landmark (optional).
- Buttons: "Check Availability," Continue, "Find Nearest Centre Instead" (on failure), Back.
- Validation Rules: PIN is validated against the defined serviceable catchment area (and centre-specific catchment/pricing where it varies by location). Continue is enabled only once the PIN is valid and address fields are filled.
- Navigation: Valid PIN + address → L6. Invalid PIN → error state → "Find Nearest Centre Instead" routes to L5b.

**L5b — Centre Selection (Lab)**

- Purpose: Same pattern as R6, filtered for centres with lab capability rather than a specific radiology exam.
- Fields / Content: List of centre cards: name, address, distance, notes.
- Buttons: Centre card selection, Back.
- Validation Rules: Filtered to centres offering the tests in the current lab cart. Zero matches → empty state.
- Navigation: Centre selected → L6.

**O1 — Upload Prescription**

- Purpose: Entry point for the OCR flow — lets the patient submit a prescription instead of searching manually.
- Fields / Content: Drag-and-drop / upload zone, "Take Photo" and "Choose File" buttons, an example "good image" thumbnail for guidance.
- Buttons: Take Photo, Choose File, Back.
- Validation Rules: A file/photo must be provided to proceed; no Continue button shown until one is selected.
- Navigation: File submitted → O2.

**O2 — Processing State**

- Purpose: Reassures the patient that their upload is being read, rather than leaving them wondering if it worked.
- Fields / Content: Spinner/pulsing icon, "Reading your prescription…" message, progress bar.
- Buttons: None — transitional screen, no footer buttons.
- Validation Rules: Typical duration a few seconds.
- Navigation: OCR success → O3. OCR failure → O4.

**O3 — Extracted Items (inline in cart)**

- Purpose: Lets the patient quickly verify that the prescription was read correctly, without a separate review screen slowing them down.
- Fields / Content: Normal cart rows, each tagged "From prescription" if OCR-sourced. Low-confidence items shown with an amber outline and a confirm prompt. Unmatched lines shown as plain grey text with a "Search & Add" prompt.
- Buttons: "Search & Add" for unmatched lines, remove (✕) per item, Continue, Back.
- Validation Rules: Per Decision #10, this is not a standalone screen — it is the normal R4 / L3 / C1 cart screen with OCR-sourced rows visually distinguished.
- Navigation: Continue → R5 (location) and onward through the normal flow for whichever cart type resulted (Radiology, Lab, or Combined).

**O4 — OCR Failure Fallback**

- Purpose: Prevents a dead end when the system genuinely cannot read the uploaded prescription.
- Fields / Content: "We couldn't quite read that prescription" message and guidance.
- Buttons: "Search Manually," "Try Uploading Again."
- Validation Rules: Triggered only on total OCR failure (not low-confidence, which is handled inline at O3).
- Navigation: "Search Manually" → back to G0/search. "Try Uploading Again" → O1.

**C1 — Combined Cart**

- Purpose: Lets the patient manage a booking that spans both radiology and lab in one place.
- Fields / Content: Two separated sections — "Radiology" and "Laboratory" — each with its own remove controls, combined subtotal, and an inline notice that home collection is not available for combined bookings.
- Buttons: Remove (✕) per item in either section, Continue, Back.
- Validation Rules: Both a radiology item and a lab item must be present (this screen only appears once that's true).
- Navigation: Continue → R5 (shared location step).

**C2 — Centre Selection (Combined)**

- Purpose: Finds the one centre that can fulfil the entire combined cart.
- Fields / Content: List of centre cards filtered to those offering ALL radiology items AND lab capability for the cart's tests. Empty state with recovery options if none match.
- Buttons: Centre card selection, "Split Into Two Bookings," "Contact Support" (empty state only), Back.
- Validation Rules: Zero matching centres triggers the empty state rather than a dead end.
- Navigation: Centre selected → C3 (if MRI/contrast) or C4. Empty state → split into two separate Radiology/Lab checkouts, or contact support.

**C5 — Dual Slot Selection**

- Purpose: Lets the patient book sensible, independent times for the lab draw and the scan at the same centre, rather than one forced shared time.
- Fields / Content: Two independent date/time pickers — one for the lab sample draw, one for the scan.
- Buttons: Date/time selection per service, Continue, Back.
- Validation Rules: Both slots must be selected and valid; combined 10-minute hold applies across both.
- Navigation: Continue → SC4 (Mobile & OTP Verification).

**SC4 — Mobile Number & OTP Verification**

- Purpose: Verifies patient identity using just a phone number — no account/login required.
- Fields / Content: Step 1: 10-digit mobile number field (+91 prefix). Step 2: 6-digit OTP entry boxes.
- Buttons: Send OTP, Verify & Continue, Resend OTP (disabled 30s, then active), Back.
- Validation Rules: Mandatory before any booking is confirmed. Invalid OTP shows inline error and blocks progress; retry allowed. Resend available only after a 30-second countdown.
- Navigation: Verified → SC5, pre-filled if an existing patient record matches the number, blank otherwise. Slot hold countdown remains visible throughout.

**SC5 — Patient Details**

- Purpose: Confirms accurate patient records for the report/appointment, without allowing multiple patients per booking.
- Fields / Content: Full Name (mandatory), Date of Birth or Age (mandatory), Gender (mandatory), Email (optional). Pre-filled and editable if matched from SC4, with a "Not you? Enter new details" link.
- Buttons: Continue (disabled until mandatory fields are valid), Back.
- Validation Rules: One patient per booking, strictly enforced — no "add family member" option anywhere on this screen.
- Navigation: Continue → SC6.

**SC6 — Booking Summary & Payment Method**

- Purpose: Shows the patient exactly what they're booking and paying for before they commit — no surprises.
- Fields / Content: All cart line items with individual prices, centre name/address, date/time (two blocks for Combined), patient name, subtotal, home-collection charge if applicable, total.
- Buttons: "Pay Online Now" (primary, dominant), "Pay at Reception" (small secondary link, shown only if every cart item is eligible), Confirm Booking, Edit Booking, Back.
- Validation Rules: Booking cannot proceed without all mandatory upstream information present. Pay-at-reception is hidden entirely if any single cart item requires prepayment (mixed-cart rule).
- Navigation: Pay Online → SC7. Pay at Reception (if shown/selected) → directly to SC8.

**SC7 — Payment (Online)**

- Purpose: Collects payment through the patient's preferred method.
- Fields / Content: Segmented tabs: UPI, Card, Net Banking. UPI tab shows a UPI ID field and a QR code option.
- Buttons: Verify & Pay, Back.
- Validation Rules: Payment must succeed to proceed; failure returns the patient to this step to retry.
- Navigation: Payment success → SC8.

**SC8 — Booking Confirmation**

- Purpose: Gives the patient clear, reassuring proof that the booking worked and what to do next.
- Fields / Content: Success state with Booking ID, full appointment detail(s) (two stacked blocks for Combined), preparation reminders repeated here, confirmation-sent notice ("Confirmation sent to +91 98XXXXXX10").
- Buttons: Download Confirmation (PDF), Book Another Appointment, Close / Go to Home.
- Validation Rules: A booking reference (Booking ID) must be generated before this screen can display.
- Navigation: Book Another → G0. Close → exits the widget.

### 4.3 Report Download Screen

**RPT — Report Download**

- Purpose: Lets a returning patient retrieve completed reports without needing an account.
- Fields / Content: Mobile Number field, OTP field, list of the patient's reports once verified.
- Buttons: Verify, Download, Back.
- Validation Rules: OTP verification is mandatory before any report list or file is shown. Reports are available only after the underlying service has been completed.
- Navigation: Download → opens the selected report/invoice file.

---

## 5. Business Rules & Decision Matrix

Consolidated rules that govern behaviour across every flow.

### 5.1 Patient Rules

- Exactly one booking per patient per transaction; every new patient requires a separate booking.
- Patient identification is completed using mobile number + OTP — no account/login required.
- Existing patient details can be reused (pre-filled) after a match; new patient details are collected if no match is found.

### 5.2 Radiology Rules

- An examination selection is mandatory to proceed.
- Referral/prescription upload is optional — manual search always remains available.
- OCR-extracted values can always be edited before confirmation.
- Available centres are filtered dynamically based on the selected exam(s).
- Only genuinely available slots can be selected; unavailable ones are not selectable.

### 5.3 Laboratory Rules

- Patients can select one or more individual tests and/or packages in a single cart.
- Home Collection is available only for tests/locations flagged as eligible.
- Home Collection charges are calculated and added automatically — never a manual step.
- Preparation instructions are always displayed before final confirmation.

### 5.4 Combined Booking Rules

- A patient may start with Radiology and add Laboratory tests, or the reverse — both directions are supported identically.
- Both services must appear together in one booking summary.
- Exactly one booking confirmation is generated for the combined booking, never two.

### 5.5 Payment Rules

- Payment mode configuration (online-only vs. online + pay-at-centre) is controlled per organization (tenant), not hard-coded globally.
- Booking is only confirmed once the applicable payment condition for that organization's configuration is met.
- Prepaid is always the default, visually dominant path; pay-at-reception is always secondary and can be fully suppressed by cart contents.

### 5.6 OCR Rules

- OCR processing starts immediately after a referral/prescription is uploaded.
- The patient always reviews (implicitly, via the tagged cart rows) and can edit extracted information before it becomes part of the booking.
- If OCR fails entirely, the flow falls back to manual search rather than blocking the patient.

### 5.7 Report & Cancellation Rules

- Reports become available only after the underlying service is completed.
- OTP verification is required before any report can be downloaded.
- Invoices can be downloaded alongside reports where available.
- Cancellation and reschedule policies are defined per organization (tenant), not globally fixed.
- Unavailable slots can never be selected during a reschedule, same as initial booking.

### 5.8 Notification & Error-Handling Rules

- A confirmation SMS is sent automatically after every successful booking; email is sent when enabled for that organization; reminder notifications are configurable per organization.
- Invalid OTP prevents further progress; expired OTP requires a fresh one to be generated (old one invalidated).
- Unavailable slots always require a fresh selection — never silently substituted.
- Payment failure always returns the patient to the payment step, never silently drops the booking.
- Any unexpected system error shows a friendly, retry-capable message instead of a raw failure.

### 5.9 Cross-Cutting Rules Reference Table

| Rule Area                          | Rule                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Search                             | Minimum 3 characters to trigger results.                                                                                                          |
| Patients per booking               | Exactly one.                                                                                                                                      |
| Slot hold                          | 10 minutes from selection; countdown visible; expiry returns patient to slot selection.                                                           |
| Payment                            | Prepaid is default/dominant; pay-at-reception hidden entirely if any cart item requires prepayment.                                               |
| Combined booking centre rule       | Must be a single centre offering both radiology and lab; no match → offer to split into two bookings.                                             |
| Combined booking sample collection | Centre visit only — home collection is not offered for combined bookings.                                                                         |
| Safety / eligibility               | Applies when cart contains MRI or contrast study; any flagged answer blocks online confirmation, routes to callback.                              |
| Preparation instructions           | Shown after centre selection, before slot selection.                                                                                              |
| Package upsell                     | Suggested when a package is a superset of the cart within a cost threshold, or matches an admin-curated mapping.                                  |
| Home collection PIN                | Validated against serviceable catchment; invalid PIN offers nearest centre as fallback.                                                           |
| OCR                                | Extracted items merge inline into the normal cart; low-confidence/unmatched items flagged; total failure falls back to manual search.             |
| OTP                                | Mandatory before booking confirmation; invalid OTP blocks progress with retry; resend available after 30 seconds.                                 |
| Slot capacity                      | Prototype uses a simplified fixed slot list per day per centre; production should model phlebotomist/machine capacity explicitly (see Section 7). |

---

## 6. Integrations Required

RLAP is not a standalone app — it depends on a number of external systems and services to function. These are grouped by whether they are needed for the initial MVP or are planned as later phases.

### 6.1 MVP-Required Integrations

| Integration               | Purpose                                                                                             | Example Provider(s)                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| OTP / Mobile Verification | Verifies patient identity via SMS OTP without requiring account creation.                           | MSG91, Twilio Verify                                        |
| SMS Notifications         | Sends booking confirmations and reminders via text message.                                         | MSG91                                                       |
| Email Notifications       | Sends booking confirmations and reminders via email where enabled.                                  | Standard transactional email provider (e.g., SES, SendGrid) |
| WhatsApp Business API     | Sends confirmations/reminders via WhatsApp, and powers the WhatsApp conversational booking channel. | WhatsApp Business API (via a BSP such as Gupshup/Interakt)  |
| Payment Gateway           | Processes UPI, Card, and Net Banking payments for prepaid bookings.                                 | Razorpay (specified in current tech stack notes)            |
| OCR Engine                | Reads uploaded prescription images/files and extracts exam/test line items.                         | Google Cloud Vision                                         |
| Geolocation               | Powers "Use my current location" for nearest-centre lookup.                                         | Browser Geolocation API + a maps/geocoding service          |

### 6.2 Planned / Future-Phase Integrations

| Integration                         | Purpose                                                                                                                              | Notes                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| LIS (Laboratory Information System) | Syncs bookings directly with the diagnostic centre's internal lab system to prevent double-booking and enable real-time result flow. | Not designed yet — depends on each tenant's existing LIS vendor.                          |
| RIS (Radiology Information System)  | Same purpose as LIS, for imaging/radiology scheduling and reporting systems.                                                         | Not designed yet — tenant-specific.                                                       |
| CRM Integration                     | Feeds booking and patient interaction data into the diagnostic organization's CRM.                                                   | Referenced in early architecture notes as a future integration.                           |
| Conversational AI / Voice Booking   | Extends booking to voice calls, following the vEngage.ai "Olivia AI" conversational pattern.                                         | Positioned as a fast-follow after Web and WhatsApp channels are live.                     |
| Admin Portal APIs                   | Lets centre/organization administrators manage catalogue, pricing, slot capacity, and package upsell rules.                          | Entirely undesigned as of this document — part of the recommended technical design phase. |

### 6.3 Notification Channels Summary

- SMS — sent automatically after every successful booking.
- Email — sent when enabled for the organization (tenant-level configuration).
- WhatsApp — used both for booking confirmations and as a full conversational booking channel.
- In-app confirmation screen — always shown regardless of channel configuration.

---

## 7. High-Level Architecture

The system is best understood as a layered flow:

Patient → Frontend / Conversational AI (Web widget, WhatsApp, Voice) → Booking Engine (search, cart, slots, OTP, payment, OCR) → Database (multi-tenant: tests, prices, centres, slots, bookings, patients) → Integration Layer → Diagnostic Chain Systems (future: LIS, RIS, CRM) + Payment Gateway + Notification Providers

### 7.1 Key Architectural Characteristics

- Multi-tenant by design — every diagnostic organization that signs up gets its own catalogue, pricing, branding, and centre list, running on one shared codebase and database.
- White-label — each tenant's booking widget reflects their own branding, not vEngage's, even though the underlying engine is shared.
- Multi-channel — the same booking engine and business rules are exposed through the web widget, WhatsApp, and (planned) voice, rather than each channel having its own separate logic.
- Non-functional requirements called out from the outset: the platform must be scalable, secure, multi-tenant-safe, responsive, and highly available.

### 7.2 What Is Fully Specified vs. Still Open

| Component                                                          | Status                                                                                               |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Patient-facing booking widget (all screens, states, design system) | Fully specified — 33 screens, 25 error/system states, 8 shared components.                           |
| QA test flows & UX review                                          | Complete — happy paths, alternate paths, edge cases, heuristic review.                               |
| Business rules & decision matrix                                   | Complete for v1 scope (see Section 5).                                                               |
| Backend architecture, database schema, API design                  | Not designed — recommended as a dedicated 1–2 week technical design phase before development starts. |
| Admin portal (catalogue, pricing, capacity, package rules)         | Not designed — open item.                                                                            |
| Real-time LIS/RIS/CRM integrations                                 | Not designed — future phase, dependent on each tenant's existing systems.                            |
| Slot capacity modelling (phlebotomist/machine-level)               | Simplified for the prototype (fixed slot list); production-grade capacity math is an open item.      |
| Real payment gateway integration                                   | Current spec (SC7) is a visual mock only — real Razorpay/PayU integration is a build-phase task.     |

---

## 8. Open Items & Assumptions Requiring Sign-off

These decisions were made to keep the specification coherent, but need explicit confirmation from stakeholders/client before they are treated as final:

- **Combined bookings = Centre Visit only, no Home Collection.** If a combined cart is built and the only shared centre doesn't make sense for a home draw, the system should communicate this clearly rather than silently forcing a centre visit.
- **Failed safety/eligibility check blocks online slot confirmation entirely, routing to a callback/phone request.** This protects patient safety but does mean a booking that started smoothly can dead-end online — confirm this is acceptable, or whether centres would prefer to flag-and-proceed with a warning instead.
- **Placeholder catalogue.** Modalities, body-part taxonomy, and lab test categories used throughout the specification (Ultrasound/CT/MRI/X-Ray/ECG; Head & Neck/Chest & Cardiac/Abdomen & Pelvis/Spine/Upper Limb/Lower Limb/Whole Body) are illustrative and need to be reconciled against Vijaya Diagnostics' (and future tenants') real catalogues before launch.

> **[TRUNCATED HERE]** The remainder of Section 8 and all of Section 9 (Glossary) were cut off by
> the source paste's length limit and are not yet captured in this file. Re-paste the rest (or the
> full doc) when you have it and this file will be updated.

---

## 9. Glossary

_Not yet captured — see truncation note above._
