export const isBadLocation = (data: any): boolean => {
   if (data.error === "Unable to geocode") return true; 

   const badTypes = ['water', 'sea', 'ocean', 'river', 'lake', 'cemetery', 'grave_yard', 'industrial', 'military'];
   if (badTypes.includes(data.type) || badTypes.includes(data.class)) return true;

   const name = (data.display_name || '').toLowerCase();
   const badKeywords = [
     'море', 'озера', 'озеро', 'пруд', 'водохранилище', 'река', 
     'кладбище', 'завод', 'фабрика', 'промзона', 
     'sea', 'ocean', 'lake', 'river', 'cemetery', 'factory', 'water'
   ];
   
   return badKeywords.some(kw => name.includes(kw));
};
