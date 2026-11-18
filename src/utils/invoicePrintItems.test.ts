import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolvePrintableCreatorName,
  sanitizeManualItems,
  buildPrintableManualItemRows,
  computeManualItemTotal,
} from './invoicePrintItems';

test('resolvePrintableCreatorName replaces "أنت" and blank values with current user full name', () => {
  assert.equal(resolvePrintableCreatorName('أنت', 'المدير العام'), 'المدير العام');
  assert.equal(resolvePrintableCreatorName('  ', 'المحاسب المالي'), 'المحاسب المالي');
  assert.equal(resolvePrintableCreatorName(undefined, 'سالم محمد'), 'سالم محمد');
});

test('resolvePrintableCreatorName preserves explicit system creator name and falls back safely', () => {
  assert.equal(resolvePrintableCreatorName('أحمد علي', 'المدير العام'), 'أحمد علي');
  assert.equal(resolvePrintableCreatorName('أنت', ''), 'المسؤول المالي');
  assert.equal(resolvePrintableCreatorName('', ''), 'المسؤول المالي');
});

test('computeManualItemTotal calculates quantity * unitPrice when both are numeric', () => {
  assert.equal(computeManualItemTotal('5', '12.5'), '62.5');
  assert.equal(computeManualItemTotal('3', '100'), '300');
  assert.equal(computeManualItemTotal('', '100'), null);
  assert.equal(computeManualItemTotal('3', ''), null);
  assert.equal(computeManualItemTotal('غير محدد', '50'), null);
});

test('sanitizeManualItems trims all 5 columns and drops completely empty rows', () => {
  const result = sanitizeManualItems([
    { serial: ' 1 ', name: ' شاشة عرض ', quantity: ' 2 ', unitPrice: ' 225 ', totalPrice: ' 450 ' },
    { serial: '  ', name: '', quantity: '', unitPrice: '', totalPrice: '  ' },
    { serial: '2', name: 'كابل', quantity: '4', unitPrice: '', totalPrice: '' },
  ]);

  assert.deepEqual(result, [
    { serial: '1', name: 'شاشة عرض', quantity: '2', unitPrice: '225', totalPrice: '450' },
    { serial: '2', name: 'كابل', quantity: '4', unitPrice: '', totalPrice: '' },
  ]);
});

test('buildPrintableManualItemRows pads blank rows with all 5 fields up to minBlankRows', () => {
  const emptyPadded = buildPrintableManualItemRows([], 5);
  assert.equal(emptyPadded.length, 5);
  assert.deepEqual(emptyPadded[0], {
    serial: '',
    name: '',
    quantity: '',
    unitPrice: '',
    totalPrice: '',
  });

  const partiallyFilled = buildPrintableManualItemRows(
    [{ serial: '1', name: 'طابعة', quantity: '1', unitPrice: '900', totalPrice: '900' }],
    5
  );
  assert.equal(partiallyFilled.length, 5);
  assert.deepEqual(partiallyFilled[0], {
    serial: '1',
    name: 'طابعة',
    quantity: '1',
    unitPrice: '900',
    totalPrice: '900',
  });
  assert.deepEqual(partiallyFilled[4], {
    serial: '',
    name: '',
    quantity: '',
    unitPrice: '',
    totalPrice: '',
  });
});
