import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateFullReportPDF = (productos, historial, dashboardData) => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.text('Reporte Completo de Inventario', 14, 20);

  // --- Dashboard Resumen ---
  doc.setFontSize(14);
  doc.text('Resumen General', 14, 35);

  const resumen = [
    ["Total Productos", dashboardData.totalProductos],
    ["Stock Total", dashboardData.totalStock],
    ["Movimientos Registrados", dashboardData.totalMovimientos]
  ];
  
  resumen.forEach((item, index) => {
    doc.text(`${item[0]}: ${item[1]}`, 14, 45 + index * 10);
  });

  // --- Productos ---
  doc.setFontSize(14);
  doc.text('Lista de Productos', 14, 80);

  const productosColumns = ["#", "Nombre", "Categoría", "Stock", "Precio", "Descripción"];
  const productosRows = productos.map((p, index) => [
    index + 1,
    p.nombre,
    p.categoria,
    p.stock,
    `$${p.precio}`,
    p.descripcion
  ]);

  doc.autoTable({
    head: [productosColumns],
    body: productosRows,
    startY: 90
  });

  let finalY = doc.lastAutoTable.finalY + 10;

  // --- Historial ---
  doc.setFontSize(14);
  doc.text('Historial de Movimientos', 14, finalY);

  const historialColumns = ["#", "Tipo", "Producto", "Fecha", "Cantidad", "Observaciones"];
  const historialRows = historial.map((h, index) => [
    index + 1,
    h.tipo_movimiento,
    h.productos?.nombre || 'N/A',
    new Date(h.fecha).toLocaleString(),
    h.cantidad,
    h.observaciones || ''
  ]);

  doc.autoTable({
    head: [historialColumns],
    body: historialRows,
    startY: finalY + 10
  });

  doc.save('reporte_inventario_completo.pdf');
};
