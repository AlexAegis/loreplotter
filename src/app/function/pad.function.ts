export function padDigits(input: string | number, digits: number): string {
	return Array(Math.max(digits - String(input).length + 1, 0)).join('0') + input;
}
