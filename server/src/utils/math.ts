export function getCode(length: number): string {
    let code = '';

    for (let i = 0; i < length; i++) {
        code += (Math.random() * (9 - 0) + 0).toFixed().toString();
    }

    return code;
}
