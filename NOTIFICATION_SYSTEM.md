# NOTIFICATION SYSTEM IMPLEMENTATION - ROLE-BASED NOTIFICATIONS

## Overview
A complete role-specific notification system has been implemented for the Sigap SPJ application. The system automatically fetches and displays notifications based on user roles and satker (organizational unit) configuration, with support for both Pencairan (fund disbursement) and SBML/SPK-BAST (document signature) notifications.

---

## Files Created

### 1. **src/contexts/NotificationsContext.tsx**
- Manages global notification state using React Context
- Provides methods to:
  - `dismissNotification(id)`: Remove a single notification
  - `clearAll()`: Clear all notifications
  - `_setNotifications()`: Update notifications (for hook use)
- Exports `useNotificationsContext()` hook for accessing notification state

### 2. **src/types/notifications.ts**
- Type definitions for the notification system:
  - `Notification`: Base notification interface
  - `PencairanNotification`: Fund disbursement notifications with submission status
  - `SBMLNotification`: Signature/document notifications with personnel info
  - `NotificationType`: 'pencairan' | 'sbml_spk' | 'system'
  - `NotificationPriority`: 'high' | 'medium' | 'low'

### 3. **src/components/NotificationsCenter.tsx**
- React component rendering a popover-based notification center
- Features:
  - Bell icon with unread count badge
  - Scrollable notification list with max height
  - Dismissible notifications (X button on hover)
  - Color-coded by priority and notification type
  - Click-through to related pages via `actionUrl`
  - "Clear All" button for bulk dismissal
  - Empty state when no notifications

### 4. **src/hooks/useNotifications.ts**
- Main data-fetching hook that:
  - Polls Google Sheets every 1 hour for new notifications
  - Fetches Pencairan (SPJ pencairan) submission data
  - Fetches SBML/SPK-BAST signature status
  - Filters notifications by user role
  - Handles API quota exceeded errors gracefully
  - Auto-initializes on component mount when auth & satker config ready

---

## Role-Based Notification Logic

### **Pencairan Notifications**

#### Status Mappings by Role:

**Statusnya: `incomplete_sm`** (ditolak ke SM)
- **Shown to**: Pembuat pengajuan (jika isCreatorOnly=true)
- **Message**: "{judul} ditolak Bendahara. Mohon untuk segera memperbaiki"
- **Priority**: Medium/High

**Status: `draft`** (belum dilengkapi)
- **Shown to**: Pembuat pengajuan
- **Message**: "{judul} masih belum dilengkapi Subjek Metter"
- **Priority**: Medium

**Status: `incomplete_bendahara`** (ditolak PPK)
- **Shown to**: Bendahara / Pembuat
- **Message**: "{judul} ditolak PPK. Mohon segera memperbaiki"
- **Priority**: High

**Status: `incomplete_ppk`** (ditolak PPSPM)
- **Shown to**: PPK / Pejabat Pembuat Komitmen
- **Message**: "{judul} ditolak PPSPM. Mohon segera memperbaiki"
- **Priority**: High

**Status: `incomplete_ppspm`** (ditolak KPPN)
- **Shown to**: PPSPM
- **Message**: "{judul} ditolak KPPN. Mohon segera memperbaiki"
- **Priority**: High

**Status: `incomplete_kppn`** (ditolak Arsip)
- **Shown to**: Arsip
- **Message**: "{judul} ditolak Arsip. Mohon segera memperbaiki"
- **Priority**: High

**Status: `pending_bendahara`** (menunggu verifikasi)
- **Shown to**: Bendahara
- **Message**: "Harap periksa kelengkapan berkas dari pengajuan {judul}"
- **Priority**: Medium

**Status: `pending_ppk`** (menunggu verifikasi PPK)
- **Shown to**: PPK / Pejabat Pembuat Komitmen
- **Message**: "{judul} untuk diperiksa"
- **Priority**: Medium

**Status: `pending_ppspm`** (menunggu verifikasi PPSPM)
- **Shown to**: PPSPM
- **Message**: "{judul} untuk diperiksa"
- **Priority**: High

**Status: `sent_kppn`** (dikirim ke Arsip)
- **Shown to**: Arsip
- **Message**: "{judul} untuk di arsipkan"
- **Priority**: Medium

### **SBML/SPK-BAST Notifications**

**Rekap SPK-BAST - Tandatangan Mitra Belum Lengkap**
- **Shown to**: All roles except PPSPM and Arsip
- **Condition**: When "Status TTD" contains "belum" or "tidak" AND Status Notif contains "sudah"
- **Message**: "Periode SPK-BAST {periode}. Mohon bantuannya untuk mengingatkan mitra terkait tanda tangan dokumen SPK–BAST yang belum lengkap."
- **Priority**: High
- **Action**: Opens `/spk-bast/rekap-spk`

---

## Role Normalization

The system normalizes role names for consistency:
```
- "bendahara" → "Bendahara"
- "pejabat pembuat komitmen" → "PPK"
- "pejabat penandatangan" / "ppspm" → "PPSPM"
- "kppn" → "KPPN"
- "arsip" → "Arsip"
- "fungsi" → "Fungsi"
```

---

## Integration Points

### **Updated: src/pages/Layout.tsx**
- Wrapped application with `NotificationsProvider`
- Ensures all child components have access to notification context
- Structure: `NotificationsProvider > SidebarProvider > App`

### **Updated: src/components/Header.tsx**
- Replaced old static notification dropdown with `NotificationsCenter` component
- Added `useNotifications()` hook call to initialize notification fetching
- Maintains user profile dropdown

---

## Data Flow

```
┌─────────────────┐
│  useNotifications Hook
│  (mounted in Header)
├─────────────────┤
│ ✓ Check auth & satker ready
│ ✓ Poll Pencairan sheet
│ ✓ Poll SBML/SPK-BAST sheet
│ ✓ Filter by user role
│ ✓ Update context every 1 hour
└────────┬────────┘
         │
    ┌────▼────────────────────┐
    │ NotificationsContext
    │ (Global State)
    └────┬─────────────────────┘
         │
    ┌────▼──────────────────┐
    │ NotificationsCenter
    │ (UI Component)
    │ - Popover bell icon
    │ - Scrollable list
    │ - Dismiss/Clear actions
    └───────────────────────┘
```

---

## Key Features

1. **Role-Based Filtering**
   - Creator-only notifications highlight submissions from the user
   - Role-based routing shows relevant statuses to each role
   - Normalized role matching for flexible role name variations

2. **Polling Mechanism**
   - Initial fetch on app load (when satker config ready)
   - Hourly polling for updates (configurable via `POLLING_INTERVAL`)
   - Debounced requests to prevent API quota issues
   - Graceful handling of 429 (quota exceeded) errors

3. **Google Sheets Integration**
   - Reads from `pencairan` sheet: Column A-R (ID, Title, Status, User, etc.)
   - Reads from `entrikegiatan` sheet: Signature statuses
   - Auto-detects sheet structure (old/new/newest formats)
   - Uses column indices for reliable data extraction

4. **User Experience**
   - Visual priority indicators (color, icon, badge count)
   - Relative timestamps ("5 minutes ago") or custom display times
   - Empty state messaging when no notifications
   - Single-click navigation to relevant pages

---

## Configuration Notes

### Environment Requirements
- User must be authenticated (useAuth context)
- Satker configuration must be loaded (useSatkerConfigContext)
- Google Sheets API access for pencairan and entrikegiatan sheets

### Polling Interval
- **Default**: 1 hour (3,600,000 ms)
- Can be adjusted in `useNotifications.ts`: `const POLLING_INTERVAL = ...`

### API Quota Handling
- Detects 429 errors and backoff flag
- Prevents cascading API calls when quota exceeded
- Graceful degradation without error messages

---

## Testing the System

1. **Start dev server**: `npm run dev`
2. **Login** with different user roles
3. **View notifications** in the bell icon (top-right)
4. **Test dismissal**: Click X on notification or "Clear All"
5. **Test navigation**: Click notification title to navigate

---

## Future Enhancements

- [ ] Push notifications (browser/mobile)
- [ ] Email digest of daily notifications
- [ ] Notification preference settings per role
- [ ] Mark as read vs. dismissed
- [ ] Sound alerts for high-priority items
- [ ] Real-time updates via WebSocket (vs. polling)
- [ ] Notification history/archive

---

## Troubleshooting

**Notifications not appearing?**
- Verify user is logged in (check useAuth)
- Confirm satker config is loaded (check useSatkerConfigContext)
- Check browser console for API errors
- Verify sheet IDs in SatkerConfigContext

**403/401 errors?**
- Check Supabase authentication tokens
- Verify Google Sheets API permissions
- Confirm spreadsheet sharing settings

**Too many API calls?**
- Adjust POLLING_INTERVAL to longer duration
- Implement request debouncing (MIN_REQUEST_INTERVAL)
- Check for quota limits in Google Sheets API console
