const translations = {
  "[WEAPON_PISTOL]": "Pistolet",
  "[WEAPON_CARBINERIFLE]": "Fusil d'assaut",
  "[WEAPON_KNIFE]": "Couteau",
  "[WEAPON_SMG]": "Pistolet mitrailleur",
  "[WEAPON_ASSAULTRIFLE]": "Fusil AK-47",
  "[water]": "Bouteille d'eau",
  "[bread]": "Pain",
  "[phone]": "Téléphone portable"
};
function translateText(text){
  if(!text) return text;
  for(const k in translations){
    text = text.replace(new RegExp(k,'g'), translations[k]);
  }
  return text;
}
