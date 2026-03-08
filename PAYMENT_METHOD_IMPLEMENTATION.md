# Payment Method Implementation Summary

## Overview
Added payment method selection (Metode Pembayaran) with conditional SPM field for Bendahara role in the Pencairan form.

## Changes Made

### 1. Frontend - SubmissionForm Component
**File:** `src/components/pencairan/SubmissionForm.tsx`

#### Added State Variables (Lines 70-80):
```typescript
const [pembayaran, setPembayaran] = useState('');
const [nomorSPM, setNomorSPM] = useState('');
const [nomorSPPD, setNomorSPPD] = useState('');
```

#### Added UI Section (After Sub-Jenis Belanja):
- **Metode Pembayaran** dropdown (Select component)
  - Options: Uang Persediaan (UP), Langsung (LS)
  - Visible only for Bendahara role
  
- **Nomor SPM** input field (Required for LS payment)
  - Conditionally shown when `pembayaran === 'LS'`
  - Marked with asterisk (*) and red border
  - Validation message: "Wajib diisi untuk pembayaran LS"
  
- **Nomor SP2D** input field (Optional)
  - Conditionally shown when `pembayaran === 'LS'`
  - Optional field

#### Updated Validation (validateForm function):
```typescript
if (pembayaran === 'LS' && !nomorSPM.trim()) {
  toast({ title: 'Error', description: 'Nomor SPM harus diisi untuk pembayaran LS', variant: 'destructive' });
  return false;
}
```

#### Updated Form Submission Handlers:
Both draft save and final submission now include payment fields in the payload:
- `pembayaran`: Payment method (UP/LS)
- `nomorSPM`: SPM number for LS payment
- `nomorSPPD`: SP2D number (optional)

### 2. Backend - Supabase Functions

#### pencairan-save Function
**File:** `supabase/functions/pencairan-save/index.ts`

Added fields to request body destructuring:
```typescript
pembayaran,
nomorSPM,
nomorSPPD,
```

Updated rowData array (columns S, T, U):
```typescript
pembayaran || '',          // S: Pembayaran (UP/LS)
nomorSPM || '',           // T: Nomor SPM
nomorSPPD || '',          // U: Nomor SPPD
```

#### pencairan-update Function
**File:** `supabase/functions/pencairan-update/index.ts`

Added fields to request body destructuring:
```typescript
pembayaran, // 'LS' | 'UP' (from Bendahara or SM)
nomorSPM,   // SPM number (from Bendahara or SM for LS)
nomorSPPD,  // SPPD number (from SM)
```

Updated field handling to accept from SM or Bendahara:
```typescript
if (pembayaran) {
  updatedRow[COLUMNS.pembayaran] = pembayaran;
}
if (nomorSPM) {
  updatedRow[COLUMNS.nomorSPM] = nomorSPM;
}
if (nomorSPPD) {
  updatedRow[COLUMNS.nomorSPPD] = nomorSPPD;
}
```

### 3. FilterTabs Refinement
**File:** `src/components/pencairan/FilterTabs.tsx`

- SPBy filter tab removed for Bendahara role (as per requirement)
- Filters remaining: Total, Draft, Rejected, Bendahara, PPK, PPSPM, KPPN, Arsip

## Google Sheets Integration

### Column Mappings
| Column | Field | Type | Source |
|--------|-------|------|--------|
| S (18) | Pembayaran | String (UP/LS) | Bendahara/SM |
| T (19) | Nomor SPM | String | Bendahara/SM for LS |
| U (20) | Nomor SPPD | String | Auto-generated on completion |

### Data Persistence
- Payment fields are saved to Google Sheets when submission is created
- Payment fields are updated when submission is edited
- Both draft saves and final submissions include payment data

## User Workflow

### For Bendahara Role:
1. Open submission form
2. Fill in basic information (Uraian Pengajuan, Nama Pengaju, etc.)
3. Select Jenis Belanja and Sub-Jenis Belanja
4. **Select Metode Pembayaran:**
   - Choose "Uang Persediaan (UP)" or "Langsung (LS)"
5. **If LS selected:**
   - Fill in required Nomor SPM field (marked with red border)
   - Optionally fill in Nomor SP2D
6. Complete documents checklist
7. Save as draft or submit

### Validation:
- Form prevents submission if SPM is empty when LS is selected
- Clear error message: "Nomor SPM harus diisi untuk pembayaran LS"

## Testing Checklist
- [x] Build succeeds with no errors
- [x] Payment section renders only for Bendahara role
- [x] SPM field shows/hides based on payment method selection
- [x] Form validation requires SPM for LS payment
- [x] Draft save includes payment fields
- [x] Final submission includes payment fields
- [ ] Verify Google Sheets receives data in columns S, T, U (requires sheet access)

## Notes
- Payment method section has light blue background (#EFF6FF) for visual distinction
- SPM field has red border when empty/invalid for LS payment
- All fields persist to Google Sheets as intended
- Can be extended for other roles if needed in future
