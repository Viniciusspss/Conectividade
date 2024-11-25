export const processMunicipiosData = (municipios) => {
    return municipios.map((row) => ({
        ...row,
        "% moradores cobertos": row["% moradores cobertos"]
            ? parseFloat(row["% moradores cobertos"].replace("%", "").replace(",", ".").trim()) || 0
            : 0, 
        "Código IBGE": String(row["Código IBGE"]?.trim()),
    }));
};


export const groupOperadorasData = (operadoras) => {
    return operadoras.reduce((acc, row) => {
        const codigo = String(row["Código IBGE"]?.trim());
        const empresa = row["Empresa"]?.trim();
        if (!acc[codigo]) acc[codigo] = [];
        if (empresa && !acc[codigo].includes(empresa)) acc[codigo].push(empresa);
        return acc;
    }, {});
};

export const mergeData = (municipios, operadoras) => {
    const groupedOperadoras = groupOperadorasData(operadoras);
    return municipios.map((municipio) => {
        const empresas = groupedOperadoras[municipio["Código IBGE"]] || [];
        return {
            ...municipio,
            Empresa: empresas.join("; <br>") || "N/A",
        };
    });
};
