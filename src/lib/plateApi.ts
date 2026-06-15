/**
 * Mock API for Vehicle Plate lookup.
 * In a real production scenario, this should be replaced by a real API like:
 * - Sinesp API
 * - InfoSimples
 * - PlacaAPI
 * - CheckPlaca
 */

export interface PlateResult {
  brand: string;
  model: string;
  year: number;
  color: string;
}

export async function fetchVehicleByPlate(plate: string): Promise<PlateResult> {
  return new Promise((resolve, reject) => {
    // Simulate network delay
    setTimeout(() => {
      const cleanPlate = plate.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      
      if (cleanPlate.length !== 7) {
        return reject(new Error("Placa inválida."));
      }

      // Mock database of cars to give varied results based on the first letter of the plate
      const firstLetter = cleanPlate.charAt(0);
      
      let result: PlateResult;
      
      if (firstLetter < 'F') {
        result = { brand: "Honda", model: "Civic EXL 2.0", year: 2020, color: "Prata" };
      } else if (firstLetter < 'K') {
        result = { brand: "Toyota", model: "Corolla XEI 2.0", year: 2021, color: "Preto" };
      } else if (firstLetter < 'P') {
        result = { brand: "Chevrolet", model: "Onix Plus 1.0 Turbo", year: 2022, color: "Branco" };
      } else if (firstLetter < 'T') {
        result = { brand: "Volkswagen", model: "Nivus Highline", year: 2023, color: "Cinza" };
      } else {
        result = { brand: "Jeep", model: "Compass Longitude", year: 2021, color: "Branco" };
      }

      resolve(result);
    }, 1500); // 1.5 seconds to simulate API request
  });
}
