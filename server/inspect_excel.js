const xlsx = require('xlsx');
const filename = "C:/Users/Aditya Kaushik/Desktop/cp plus hikvision tenda.xlsx";
try {
    const workbook = xlsx.readFile(filename);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }); // Header array
    console.log("Headers:", data[0]);
    console.log("First Row:", data[1]);
} catch (e) {
    console.error(e.message);
}
