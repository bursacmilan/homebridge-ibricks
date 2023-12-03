import { MessageInterpretor } from '../services/message-interpretor';

describe('Testing director message interpretor', () => {
    test('SICHG should be interpreted correctly', () => {
        const message = '.KISS|AF=F4CFA2DB6626|AT=0000000CLOUD|N=698|E|SICHG|T=TEMP|CH=1|U=CEL|V=21.51';
        const interpretedMessage = MessageInterpretor.interpret(message);

        expect(interpretedMessage.protocol).toBe('.KISS');
        expect(interpretedMessage.addressFrom).toBe('F4CFA2DB6626');
        expect(interpretedMessage.addressTo).toBe('0000000CLOUD');
        expect(interpretedMessage.nonce).toBe('698');
        expect(interpretedMessage.type).toBe('E');
        expect(interpretedMessage.command).toBe('SICHG');
        expect(interpretedMessage.channel).toBe(1);

        expect(interpretedMessage.additionalData.get('T')).toBe('TEMP');
        expect(interpretedMessage.additionalData.get('U')).toBe('CEL');
        expect(interpretedMessage.additionalData.get('V')).toBe('21.51');
        expect(interpretedMessage.additionalData.size).toBe(3);
    });

    test('BDCHG should be interpreted correctly', () => {
        const message = '.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=7|E|BDCHG|CH=1|U=CEL|V=18.00';
        const interpretedMessage = MessageInterpretor.interpret(message);

        expect(interpretedMessage.protocol).toBe('.KISS');
        expect(interpretedMessage.addressFrom).toBe('8CAAB5FA2BB5');
        expect(interpretedMessage.addressTo).toBe('0000000CLOUD');
        expect(interpretedMessage.nonce).toBe('7');
        expect(interpretedMessage.type).toBe('E');
        expect(interpretedMessage.command).toBe('BDCHG');
        expect(interpretedMessage.channel).toBe(1);

        expect(interpretedMessage.additionalData.get('U')).toBe('CEL');
        expect(interpretedMessage.additionalData.get('V')).toBe('18.00');
        expect(interpretedMessage.additionalData.size).toBe(2);
    });
});

describe('Testing shutter message interpretor', () => {
    test('ASCHG should be interpreted correctly', () => {
        const message = '.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=3108|E|ASCHG|CH=1|CMD=HL|H=0.826|L=0.000';
        const interpretedMessage = MessageInterpretor.interpret(message);

        expect(interpretedMessage.protocol).toBe('.KISS');
        expect(interpretedMessage.addressFrom).toBe('8CAAB5FA2BB5');
        expect(interpretedMessage.addressTo).toBe('0000000CLOUD');
        expect(interpretedMessage.nonce).toBe('3108');
        expect(interpretedMessage.type).toBe('E');
        expect(interpretedMessage.command).toBe('ASCHG');
        expect(interpretedMessage.channel).toBe(1);

        expect(interpretedMessage.additionalData.get('CMD')).toBe('HL');
        expect(interpretedMessage.additionalData.get('H')).toBe('0.826');
        expect(interpretedMessage.additionalData.get('L')).toBe('0.000');
        expect(interpretedMessage.additionalData.size).toBe(3);
    });
});

describe('Testing relay and dimmer message interpretor', () => {
    test('LDCHG should be interpreted correctly', () => {
        const message = '.KISS|AF=8CAAB5FAABBE|AT=0000000CLOUD|N=727|E|LDCHG|CH=1|V=0.000';
        const interpretedMessage = MessageInterpretor.interpret(message);

        expect(interpretedMessage.protocol).toBe('.KISS');
        expect(interpretedMessage.addressFrom).toBe('8CAAB5FAABBE');
        expect(interpretedMessage.addressTo).toBe('0000000CLOUD');
        expect(interpretedMessage.nonce).toBe('727');
        expect(interpretedMessage.type).toBe('E');
        expect(interpretedMessage.command).toBe('LDCHG');
        expect(interpretedMessage.channel).toBe(1);

        expect(interpretedMessage.additionalData.get('V')).toBe('0.000');
        expect(interpretedMessage.additionalData.size).toBe(1);
    });

    test('LRCHG should be interpreted correctly', () => {
        const message = '.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=474|E|LRCHG|CH=1|ST=0';
        const interpretedMessage = MessageInterpretor.interpret(message);

        expect(interpretedMessage.protocol).toBe('.KISS');
        expect(interpretedMessage.addressFrom).toBe('8CAAB5FA2BB5');
        expect(interpretedMessage.addressTo).toBe('0000000CLOUD');
        expect(interpretedMessage.nonce).toBe('474');
        expect(interpretedMessage.type).toBe('E');
        expect(interpretedMessage.command).toBe('LRCHG');
        expect(interpretedMessage.channel).toBe(1);

        expect(interpretedMessage.additionalData.get('ST')).toBe('0');
        expect(interpretedMessage.additionalData.size).toBe(1);
    });
});

describe('Testing IAMMASTER response message interpretor', () => {
    test('YHELO should be interpreted correctly', () => {
        const message = '.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=453|E|YHELO|IP=192.168.3.250|DESC=Buero+%2D+T1';
        const interpretedMessage = MessageInterpretor.interpret(message);

        expect(interpretedMessage.protocol).toBe('.KISS');
        expect(interpretedMessage.addressFrom).toBe('8CAAB5FA2BB5');
        expect(interpretedMessage.addressTo).toBe('0000000CLOUD');
        expect(interpretedMessage.nonce).toBe('453');
        expect(interpretedMessage.type).toBe('E');
        expect(interpretedMessage.command).toBe('YHELO');
        expect(interpretedMessage.channel).toBe(-1);

        expect(interpretedMessage.additionalData.get('IP')).toBe('192.168.3.250');
        expect(interpretedMessage.additionalData.get('DESC')).toBe('Buero+%2D+T1');
        expect(interpretedMessage.additionalData.size).toBe(2);
    });
});

describe('Testing debug info message interpretor', () => {
    test('YINFO should be interpreted correctly', () => {
        const message = '.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=460|E|YINFO|T=DebugInfo|V=Hardware=1R1S1H/1803;Firmware=2.2.44.PROD...';
        const interpretedMessage = MessageInterpretor.interpret(message);

        expect(interpretedMessage.protocol).toBe('.KISS');
        expect(interpretedMessage.addressFrom).toBe('8CAAB5FA2BB5');
        expect(interpretedMessage.addressTo).toBe('0000000CLOUD');
        expect(interpretedMessage.nonce).toBe('460');
        expect(interpretedMessage.type).toBe('E');
        expect(interpretedMessage.command).toBe('YINFO');
        expect(interpretedMessage.channel).toBe(-1);

        expect(interpretedMessage.additionalData.get('T')).toBe('DebugInfo');
        expect(interpretedMessage.additionalData.get('V')).toBe('Hardware=1R1S1H/1803;Firmware=2.2.44.PROD...');
        expect(interpretedMessage.additionalData.size).toBe(2);
    });
});
