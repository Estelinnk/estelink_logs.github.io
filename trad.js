// Dictionnaire de traduction des noms techniques
const translations = {
    // Armes
    "[WEAPON_PISTOL]": "Pistolet",
    "[WEAPON_CARBINERIFLE]": "Fusil d'assaut",
    "[WEAPON_KNIFE]": "Couteau",
    "[WEAPON_SMG]": "Pistolet mitrailleur",
    "[WEAPON_ASSAULTRIFLE]": "Fusil AK-47",

    // Objets
    "[water]": "Bouteille d'eau",
    "[bread]": "Pain",
    "[phone]": "Téléphone",
};

// Fonction utilitaire pour remplacer les noms techniques par leur traduction
function translateText(text) {
    if (!text) return text;
    Object.keys(translations).forEach(key => {
        text = text.replace(new RegExp(key, 'g'), translations[key]);
    });
    return text;
}
