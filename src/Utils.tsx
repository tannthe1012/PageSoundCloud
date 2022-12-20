export default class Utils {
    static SaveFile(name: string, buffer: ArrayBuffer) {
        var url = URL.createObjectURL(new Blob([buffer]));
        var link = document.createElement("a");
        link.href = url;
        link.download = name;
        link.click();
    }

    static StringIsNullOrEmpty(str: string | undefined, trim: boolean = false) {
        return str == null || (trim ? str.trim().length == 0 : str.length == 0);
    }
}