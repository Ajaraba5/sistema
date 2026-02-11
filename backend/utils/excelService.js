const XLSX = require('xlsx');
const Persona = require('../models/Persona');

class ExcelService {
    // Import personas from Excel
    static async importExcel(fileBuffer) {
        try {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);

            const results = {
                success: 0,
                errors: []
            };

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                try {
                    await Persona.create({
                        nombre: row.nombre || row.Nombre,
                        cedula: row.cedula || row.Cedula,
                        telefono: row.telefono || row.Telefono,
                        direccion: row.direccion || row.Direccion,
                        zona: row.zona || row.Zona,
                        partido: row.partido || row.Partido,
                        lider_id: row.lider_id || row.Lider_ID || null,
                        contador_id: row.contador_id || row.Contador_ID || null
                    });
                    results.success++;
                } catch (error) {
                    results.errors.push({
                        row: i + 2, // Excel row number (1-indexed + header)
                        data: row,
                        error: error.message
                    });
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Error importing Excel: ${error.message}`);
        }
    }

    // Export personas to Excel
    static async exportExcel() {
        try {
            const personas = await Persona.findAll();

            const data = personas.map(p => ({
                ID: p.id,
                Nombre: p.nombre,
                Cedula: p.cedula,
                Telefono: p.telefono,
                Direccion: p.direccion,
                Zona: p.zona,
                Partido: p.partido,
                Lider: p.lider_nombre || '',
                Contador: p.contador_nombre || '',
                'Ha Votado': p.ha_votado ? 'Sí' : 'No',
                'Fecha Voto': p.fecha_voto ? new Date(p.fecha_voto).toLocaleString() : '',
                'Fecha Creación': new Date(p.created_at).toLocaleString()
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Personas');

            // Set column widths
            const wscols = [
                { wch: 5 },  // ID
                { wch: 30 }, // Nombre
                { wch: 15 }, // Cedula
                { wch: 15 }, // Telefono
                { wch: 30 }, // Direccion
                { wch: 15 }, // Zona
                { wch: 15 }, // Partido
                { wch: 20 }, // Lider
                { wch: 20 }, // Contador
                { wch: 10 }, // Ha Votado
                { wch: 20 }, // Fecha Voto
                { wch: 20 }  // Fecha Creación
            ];
            worksheet['!cols'] = wscols;

            return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        } catch (error) {
            throw new Error(`Error exporting Excel: ${error.message}`);
        }
    }
}

module.exports = ExcelService;
