import {Message} from '../src/models/Message';

describe('Testing isEventWithCommand', () => {
  const messageWithTypeE = new Message('.KISS', 'AF', 'AT', 'N', 'E', 'TEST', 'CH', new Map<string, string>());
  const messageWithTypeX = new Message('.KISS', 'AF', 'AT', 'N', 'X', 'TEST', 'CH', new Map<string, string>());

  test('Should return true if message type is "E" and command is the correct', () => {
    expect(messageWithTypeE.isEventWithCommand('TEST')).toBe(true);
  });

  test('Should return false if message type is "E" and command is not the correct', () => {
    expect(messageWithTypeE.isEventWithCommand('INVALID')).toBe(false);
  });

  test('Should return false if message type is not "E" and command is the correct', () => {
    expect(messageWithTypeX.isEventWithCommand('TEST')).toBe(false);
  });
});

describe('Testing isEventWithCommandAndData', () => {
  const messageWithTypeE = new Message('.KISS', 'AF', 'AT', 'N', 'E', 'TEST', 'CH', new Map<string, string>([
    ['V', 'ABC'],
  ]));

  const messageWithTypeEAndNoAdditionalData = new Message('.KISS', 'AF', 'AT', 'N', 'E', 'TEST', 'CH', new Map<string, string>());

  test('Should return true if message type is "E", the command is correct and additional data is the searched value', () => {
    expect(messageWithTypeE.isEventWithCommandAndData('TEST', 'V', 'ABC')).toBe(true);
  });

  test('Should return false if message type is "E", the command is correct but additional data is not the searched value', () => {
    expect(messageWithTypeE.isEventWithCommandAndData('TEST', 'V', 'XYZ')).toBe(false);
  });

  test('Should return false if message type is "E", the command is correct but has no additional data', () => {
    expect(messageWithTypeEAndNoAdditionalData.isEventWithCommandAndData('TEST', 'V', 'XYZ')).toBe(false);
  });
});

describe('Testing getNumber', () => {
  const messageWithTypeE = new Message('.KISS', 'AF', 'AT', 'N', 'E', 'TEST', 'CH', new Map<string, string>([
    ['VALIDNUMBER', '123'],
    ['INVALIDNUMBER', 'ABC'],
    ['EMPTYNUMBER', ''],
  ]));

  test('Should return number if the string value is in a valid format', () => {
    expect(messageWithTypeE.getNumber('VALIDNUMBER')).toBe(123);
  });

  test('Should return undefined if the string value is not in a valid format', () => {
    expect(messageWithTypeE.getNumber('INVALIDNUMBER')).toBe(undefined);
  });

  test('Should return undefined if the string value is empty', () => {
    expect(messageWithTypeE.getNumber('EMPTYNUMBER')).toBe(undefined);
  });
});

describe('Testing getString', () => {
  const messageWithTypeE = new Message('.KISS', 'AF', 'AT', 'N', 'E', 'TEST', 'CH', new Map<string, string>([
    ['STRING', '123'],
    ['EMPTYSTRING', ''],
  ]));

  test('Should return string if the string value is not empty', () => {
    expect(messageWithTypeE.getString('STRING')).toBe('123');
  });

  test('Should return undefined if the string value is empty', () => {
    expect(messageWithTypeE.getNumber('EMPTYSTRING')).toBe(undefined);
  });
});

describe('Testing getMessageAsString', () => {
  test('Should convert to a string in a valid format', () => {
    const message = new Message('.KISS', '1', '2', '3', 'E', 'TEST', '', new Map<string, string>());
    expect(message.getMessageAsString()).toBe('.KISS|AF=1|AT=2|N=3|E|TEST');
  });

  test('Should add the channel if provided', () => {
    const message = new Message('.KISS', '1', '2', '3', 'E', 'TEST', '10', new Map<string, string>());
    expect(message.getMessageAsString()).toBe('.KISS|AF=1|AT=2|N=3|E|TEST|CH=10');
  });

  test('Should add the additional data at the end if provided', () => {
    const message = new Message('.KISS', '1', '2', '3', 'E', 'TEST', '10', new Map<string, string>([
      ['V', 'ABC'],
      ['V2', 'DEF'],
    ]));
    expect(message.getMessageAsString()).toBe('.KISS|AF=1|AT=2|N=3|E|TEST|CH=10|V=ABC|V2=DEF');
  });
});