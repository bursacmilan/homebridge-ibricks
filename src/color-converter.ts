export class XYPoint {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export class ColorConverter {
    private readonly _gamut = {
        red: new XYPoint(0.6915, 0.3083),
        lime: new XYPoint(0.17, 0.7),
        blue: new XYPoint(0.1532, 0.0475),
    };

    public xyToRgb(x: number, y: number, bri = 1): { r: number; g: number; b: number } {
        let xyPoint = new XYPoint(x, y);
        if (!this._checkPointInLampsReach(xyPoint)) {
            xyPoint = this._getClosestPointToPoint(xyPoint);
        }

        const Y = bri;
        const X = (Y / xyPoint.y) * xyPoint.x;
        const Z = (Y / xyPoint.y) * (1 - xyPoint.x - xyPoint.y);

        let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
        let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
        let b = X * 0.051713 - Y * 0.121364 + Z * 1.01153;

        [r, g, b] = [r, g, b].map(x => (x <= 0.0031308 ? 12.92 * x : (1.0 + 0.055) * Math.pow(x, 1.0 / 2.4) - 0.055));

        [r, g, b] = [r, g, b].map(x => Math.max(0, x));

        const maxComponent = Math.max(r, g, b);
        if (maxComponent > 1) {
            [r, g, b] = [r, g, b].map(x => x / maxComponent);
        }

        [r, g, b] = [r, g, b].map(x => Math.floor(x * 255));

        return { r, g, b };
    }

    public rgbToXy(red: number, green: number, blue: number): XYPoint {
        const normalizedToOne = [red / 255, green / 255, blue / 255];
        if (normalizedToOne[0] > 0.04045) {
            red = Math.pow((normalizedToOne[0] + 0.055) / (1.0 + 0.055), 2.4);
        } else {
            red = normalizedToOne[0] / 12.92;
        }

        if (normalizedToOne[1] > 0.04045) {
            green = Math.pow((normalizedToOne[1] + 0.055) / (1.0 + 0.055), 2.4);
        } else {
            green = normalizedToOne[1] / 12.92;
        }

        if (normalizedToOne[2] > 0.04045) {
            blue = Math.pow((normalizedToOne[2] + 0.055) / (1.0 + 0.055), 2.4);
        } else {
            blue = normalizedToOne[2] / 12.92;
        }

        const x = red * 0.664511 + green * 0.154324 + blue * 0.162028;
        const y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
        const z = red * 0.000088 + green * 0.07231 + blue * 0.986039;

        const cx = x / (x + y + z);
        const cy = y / (x + y + z);

        let xyPoint = new XYPoint(cx, cy);
        const inReach = this._checkPointInLampsReach(xyPoint);

        if (!inReach) {
            xyPoint = this._getClosestPointToPoint(xyPoint);
        }

        xyPoint.x = +xyPoint.x.toFixed(4);
        xyPoint.y = +xyPoint.y.toFixed(4);
        return xyPoint;
    }

    public rgbToHsl(rgb: [number, number, number]): { hue: number; saturation: number; lightness: number } {
        const [r, g, b] = rgb;
        const rNormalized = r / 255;
        const gNormalized = g / 255;
        const bNormalized = b / 255;

        const maxColor = Math.max(rNormalized, gNormalized, bNormalized);
        const minColor = Math.min(rNormalized, gNormalized, bNormalized);
        const lightness = (maxColor + minColor) / 2;

        let hue = 0;
        let saturation = 0;

        if (maxColor !== minColor) {
            const delta = maxColor - minColor;
            saturation = lightness > 0.5 ? delta / (2 - maxColor - minColor) : delta / (maxColor + minColor);

            switch (maxColor) {
                case rNormalized:
                    hue = (gNormalized - bNormalized) / delta + (gNormalized < bNormalized ? 6 : 0);
                    break;
                case gNormalized:
                    hue = (bNormalized - rNormalized) / delta + 2;
                    break;
                case bNormalized:
                    hue = (rNormalized - gNormalized) / delta + 4;
                    break;
            }

            hue *= 60;
        }

        return { hue, saturation: saturation * 100, lightness: lightness * 100 };
    }

    public hslToRgb(h: number, s: number, l: number): [number, number, number] {
        h = h / 360; // Convert hue to range [0, 1]
        s = Math.max(0, Math.min(1, s / 100)); // Clamp saturation to [0, 1]
        l = Math.max(0, Math.min(1, l / 100)); // Clamp lightness to [0, 1]

        if (s === 0) {
            const value = Math.round(l * 255);
            return [value, value, value];
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        const r = Math.round(this._hueToRgb(p, q, h + 1 / 3) * 255);
        const g = Math.round(this._hueToRgb(p, q, h) * 255);
        const b = Math.round(this._hueToRgb(p, q, h - 1 / 3) * 255);

        return [r, g, b];
    }

    private _hueToRgb(p: number, q: number, t: number): number {
        if (t < 0) {
            t += 1;
        }
        if (t > 1) {
            t -= 1;
        }
        if (t < 1 / 6) {
            return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
            return q;
        }
        if (t < 2 / 3) {
            return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
    }

    private _crossProduct(p1: XYPoint, p2: XYPoint): number {
        return p1.x * p2.y - p1.y * p2.x;
    }

    private _getClosestPointToLine(a: XYPoint, b: XYPoint, p: XYPoint): XYPoint {
        const ap = new XYPoint(p.x - a.x, p.y - a.y);
        const ab = new XYPoint(b.x - a.x, b.y - a.y);
        const ab2 = ab.x * ab.x + ab.y * ab.y;
        const apab = ap.x * ab.x + ap.y * ab.y;
        let t = apab / ab2;

        if (t < 0.0) {
            t = 0.0;
        } else if (t > 1.0) {
            t = 1.0;
        }

        return new XYPoint(a.x + ab.x * t, a.y + ab.y * t);
    }

    private _getDistanceBetweenPoints(one: XYPoint, two: XYPoint): number {
        const dx = one.x - two.x;
        const dy = one.y - two.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private _getClosestPointToPoint(xyPoint: XYPoint): XYPoint {
        const pab = this._getClosestPointToLine(this._gamut.red, this._gamut.lime, xyPoint);
        const pac = this._getClosestPointToLine(this._gamut.blue, this._gamut.red, xyPoint);
        const pbc = this._getClosestPointToLine(this._gamut.lime, this._gamut.blue, xyPoint);

        const dab = this._getDistanceBetweenPoints(xyPoint, pab);
        const dac = this._getDistanceBetweenPoints(xyPoint, pac);
        const dbc = this._getDistanceBetweenPoints(xyPoint, pbc);

        let lowest = dab;
        let closestPoint = pab;

        if (dac < lowest) {
            lowest = dac;
            closestPoint = pac;
        }

        if (dbc < lowest) {
            closestPoint = pbc;
        }

        const cx = closestPoint.x;
        const cy = closestPoint.y;

        return new XYPoint(cx, cy);
    }

    private _checkPointInLampsReach(point: XYPoint): boolean {
        const v1 = new XYPoint(this._gamut.lime.x - this._gamut.red.x, this._gamut.lime.y - this._gamut.red.y);
        const v2 = new XYPoint(this._gamut.blue.x - this._gamut.red.x, this._gamut.blue.y - this._gamut.red.y);

        const q = new XYPoint(point.x - this._gamut.red.x, point.y - this._gamut.red.y);
        const s = this._crossProduct(q, v2) / this._crossProduct(v1, v2);
        const t = this._crossProduct(v1, q) / this._crossProduct(v1, v2);

        return s >= 0.0 && t >= 0.0 && s + t <= 1.0;
    }
}
