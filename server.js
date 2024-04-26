const mysql = require('mysql2/promise');
const fs = require('fs');

const folderName = '';
const connectionConfig = {
  host: 'localhost',
  port:'8889',
  user: 'root',
  password: 'root',
  database: 'chambitas',
};

async function main() {
  const connection = await mysql.createConnection(connectionConfig);

  try {
    // Consulta para obtener los nombres de las tablas en la base de datos
    const [rows] = await connection.query("SELECT table_name FROM information_schema.tables WHERE table_schema = ?", [connectionConfig.database]);
    //const [rows] = await connection.query("SELECT table_schema FROM information_schema.tables ");
    console.log(rows)

    for (const row of rows) {
      const tableName = row.TABLE_NAME;
      if(tableName!=='undefined'){
        console.log(tableName);

        // Consulta para obtener la estructura de la tabla
        const [tableInfo] = await connection.query(`DESCRIBE ${tableName}`);
  
        // Transforma la estructura de la tabla en un objeto que será un entity en TypeORM
        const entityName = tableName;
        const columns = tableInfo.map((column) => {
          return {
            name: column.Field,
            type: column.Type,
          };
        });
  
        // Genera el código de la entidad con los decoradores @Column
        const entityCode = `
          import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"
  
          @Entity()
          export class ${entityName}{
              @PrimaryGeneratedColumn()
              ${columns.map((column) => `@Column({ type: '${column.type}', name: '${column.name}' })\n    ${column.name}: ${column.type};`).join('\n    ')}
          }
          `;
  
        // Define el nombre del archivo (puedes personalizar la estructura de nombres si lo deseas)
        const fileName = `${folderName!=""?folderName+'/':''}${entityName}.ts`;
  
        // Escribe el código de la entidad en el archivo
        fs.writeFileSync(fileName, entityCode);
  
        console.log(`Archivo ${fileName} creado.`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

main();