export class CharacteristicsHelper {
    public static windowCoveringPositionRound(x: number): number {
        return this._adjustToMinMaxIfNeeded(Math.ceil(x), 0, 100);
    }

    public static lamellaTiltAngleRound(x: number): number {
        return this._adjustToMinMaxIfNeeded(Math.ceil(x), -90, 90);
    }

    public static relayBrightnessRound(x: number): number {
        return this._adjustToMinMaxIfNeeded(Math.ceil(x), 0, 100);
    }

    private static _adjustToMinMaxIfNeeded(x: number, min: number, max: number): number {
        if (x > max) {
            return max;
        } else if (x < min) {
            return min;
        }

        return x;
    }
}
