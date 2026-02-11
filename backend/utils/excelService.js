const ExcelJS = require('exceljs');
const Persona = require('../models/Persona');

class ExcelService {
    // Import personas from Excel
    static async importExcel(fileBuffer) {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(fileBuffer);
            
            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                throw new Error('No worksheet found in Excel file');
            }

            const results = {
                success: 0,
                errors: []
            };

            // Skip header row (row 1) and start from row 2
            worksheet.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header
                
                try {
                    const rowData = {
                        nombre: row.getCell(1).value,
                        cedula: row.getCell(2).value,
                        telefono: row.getCell(3).value,
                        direccion: row.getCell(4).value,
                        zona: row.getCell(5).value,
                        partido: row.getCell(6).value,
                        lider_id: row.getCell(7).value || null,
                        contador_id: row.getCell(8).value || null
                    };

                    await Persona.create({
                        nombre: rowData.nombre,
                        cedula: rowData.cedula,
                        telefono: rowData.telefono,
                        direccion: rowData.direccion,
                        zona: rowData.zona,
                        partido: rowData.partido,
                        lider_id: rowData.lider_id,
                        contador_id: rowData.contador_id
                    });
                    results.success++;
                } catch (error) {
                    results.errors.push({
                        row: rowNumber,
                        error: error.message
                    });
                }
            });

            return results;
        } catch (error) {
            throw new Error(`Error importing Excel: ${error.message}`);
        }
    }

    // Export personas to Excel
    static async exportExcel() {
        try {
            const personas = await Persona.findAll();

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Sistema de Votación';
            workbook.created = new Date();
            
            const worksheet = workbook.addWorksheet('Personas');

            // Define columns
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Nombre', key: 'nombre', width: 30 },
                { header: 'Cédula', key: 'cedula', width: 15 },
                { header: 'Teléfono', key: 'telefono', width: 15 },
                { header: 'Dirección', key: 'direccion', width: 30 },
                { header: 'Zona', key: 'zona', width: 15 },
                { header: 'Partido', key: 'partido', width: 15 },
                { header: 'Líder', key: 'lider', width: 20 },
                { header: 'Contador', key: 'contador', width: 20 },
                { header: 'Ha Votado', key: 'ha_votado', width: 12 },
                { header: 'Fecha Voto', key: 'fecha_voto', width: 20 },
                { header: 'Fecha Creación', key: 'created_at', width: 20 }
            ];

            // Add rows
            personas.forEach(p => {
                worksheet.addRow({
                    id: p.id,
                    nombre: p.nombre,
                    cedula: p.cedula || '',
                    telefono: p.telefono || '',
                    direccion: p.direccion || '',
                    zona: p.zona || '',
                    partido: p.partido || '',
                    lider: p.lider_nombre || '',
                    contador: p.contador_nombre || '',
                    ha_votado: p.ha_votado ? 'Sí' : 'No',
                    fecha_voto: p.fecha_voto ? new Date(p.fecha_voto).toLocaleString() : '',
                    created_at: new Date(p.created_at).toLocaleString()
                });
            });

            // Style header row
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2563EB' }
            };
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

            // Generate buffer
            const buffer = await workbook.xlsx.writeBuffer();
            return buffer;
        } catch (error) {
            throw new Error(`Error exporting Excel: ${error.message}`);
        }
    }
}

module.exports = ExcelService;
