export const processMunicipiosData = (municipios) => {
    return municipios.map((row) => {
      const porcentagem = row["% moradores cobertos"]?.replace("%", "").replace(",", ".") || "0";
      console.log('Porcentagem processada:', porcentagem); // Verificar o valor processado
      return {
        ...row,
        "% moradores cobertos": parseFloat(porcentagem),
        "Código IBGE": row["Código IBGE"] ? String(row["Código IBGE"].trim()) : "Desconhecido",
      };
    });
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
