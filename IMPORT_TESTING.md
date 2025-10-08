# Excel Import Testing Guide

## Test Data Setup

To test the Excel import functionality, create the following test data in the app:

### 1. Test Account
- **Name**: Test Account  
- **Description**: Sample account for import testing
- **Currency**: USD ($)

### 2. Test Transactions

Add these transactions to the Test Account:

1. **Debt Transaction 1**
   - Person: John Doe
   - Amount: $100
   - Type: I Owe Money (Debt)
   - Description: Lunch money
   - Date: January 15, 2024

2. **Debt Transaction 2**
   - Person: Jane Smith  
   - Amount: $50
   - Type: I Owe Money (Debt)
   - Description: Coffee payment
   - Date: January 20, 2024

3. **Credit Transaction 1**
   - Person: Mike Johnson
   - Amount: $200
   - Type: Someone Owes Me (Credit)
   - Description: Payment for services
   - Date: January 25, 2024

## Testing Steps

### Export Test
1. Open the app and create the test data above
2. Go to Settings screen
3. Tap "Export to Excel" button
4. Confirm the export (should show 1 account, 3 transactions)
5. Verify Excel file is created and shared successfully

### Import Test (Replace Mode)
1. In Settings screen, tap "Reset All Data" to clear existing data
2. Confirm the reset
3. Tap "Import from Excel" button
4. Select the previously exported Excel file
5. Review the import preview showing:
   - 1 account to import
   - 3 transactions to import
   - Date range: Jan 15 - Jan 25, 2024
6. Choose "Replace All Data"
7. Verify success message
8. Check that all data is restored correctly

### Import Test (Merge Mode)
1. Create some different test data in the app
2. Tap "Import from Excel" button
3. Select the same Excel file
4. Review preview showing duplicate detection
5. Choose "Merge with Existing"
6. Verify merge success message with correct counts
7. Check that both original and imported data exist

## Expected Results

### Import Preview Should Show:
- Account count and names
- Transaction count and date range
- Currency information
- Duplicate warnings (in merge mode)

### After Import:
- All accounts restored with correct names, descriptions, currencies
- All transactions restored with correct amounts, types, dates, people
- Account balances recalculated correctly
- No data corruption or missing information

## Error Testing

Test error scenarios:
1. **Cancel file selection** - should return gracefully
2. **Invalid Excel file** - should show error message
3. **Empty Excel file** - should show "no data" message
4. **Corrupted data** - should show validation errors

## Validation Features

The import system includes:
- ✅ Excel file format validation
- ✅ Data structure validation  
- ✅ Currency validation
- ✅ Amount and date validation
- ✅ Duplicate detection
- ✅ Conflict resolution options
- ✅ Localized number support
- ✅ Error handling and user feedback