function sortTableByColumn(table, column, asc = true) {
    const dirModifier = asc ? 1: -1;
    const tBody = table.tBodies[0];
    const rows = Array.from(tBody.querySelectorAll("tr"));

    // Sort each Row
    const sortedRows = rows.sort((a, b) => {
        console.log(a);
        console.log(b);
    });
}

sortTableByColumn(document.querySelector("table-row"), 1);