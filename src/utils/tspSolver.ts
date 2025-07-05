import { Location, DistanceMatrix, OptimizedRoute } from '../types/route';

export class TSPSolver {
  private static readonly DISTANCE_WEIGHT = 0.3;
  private static readonly TIME_WEIGHT = 0.7;

  static async optimizeRoute(
    locations: Location[], 
    distanceMatrix: DistanceMatrix
  ): Promise<OptimizedRoute> {
    if (locations.length <= 2) {
      return {
        order: locations.map(l => l.id),
        totalDistance: 0,
        totalTime: 0,
        totalCost: 0
      };
    }

    const baseLocation = locations.find(l => l.isBase);
    const deliveryLocations = locations.filter(l => !l.isBase);
    
    if (!baseLocation) {
      throw new Error('Base location not found');
    }

    // Use nearest neighbor heuristic for small instances
    const optimizedOrder = this.nearestNeighborTSP(
      baseLocation, 
      deliveryLocations, 
      distanceMatrix
    );

    // Calculate totals
    const { totalDistance, totalTime, totalCost } = this.calculateRouteTotals(
      optimizedOrder, 
      distanceMatrix
    );

    return {
      order: optimizedOrder,
      totalDistance,
      totalTime,
      totalCost
    };
  }

  private static nearestNeighborTSP(
    base: Location,
    deliveries: Location[],
    matrix: DistanceMatrix
  ): string[] {
    const unvisited = [...deliveries];
    const route = [base.id];
    let current = base;

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let minCost = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const cost = this.calculateCost(current.id, unvisited[i].id, matrix);
        if (cost < minCost) {
          minCost = cost;
          nearestIndex = i;
        }
      }

      const nearest = unvisited.splice(nearestIndex, 1)[0];
      route.push(nearest.id);
      current = nearest;
    }

    // Return to base
    route.push(base.id);
    return route;
  }

  private static calculateCost(fromId: string, toId: string, matrix: DistanceMatrix): number {
    const element = matrix[fromId]?.[toId];
    if (!element || element.status !== 'OK') return Infinity;

    const distance = element.distance.value / 1000; // Convert to km
    const time = element.duration.value / 60; // Convert to minutes

    return this.DISTANCE_WEIGHT * distance + this.TIME_WEIGHT * time;
  }

  private static calculateRouteTotals(
    order: string[], 
    matrix: DistanceMatrix
  ): { totalDistance: number; totalTime: number; totalCost: number } {
    let totalDistance = 0;
    let totalTime = 0;
    let totalCost = 0;

    for (let i = 0; i < order.length - 1; i++) {
      const fromId = order[i];
      const toId = order[i + 1];
      const element = matrix[fromId]?.[toId];

      if (element && element.status === 'OK') {
        totalDistance += element.distance.value / 1000; // km
        totalTime += element.duration.value / 60; // minutes
        totalCost += this.calculateCost(fromId, toId, matrix);
      }
    }

    return { totalDistance, totalTime, totalCost };
  }

  // Advanced optimization using 2-opt improvement
  static optimize2Opt(
    route: string[], 
    matrix: DistanceMatrix
  ): string[] {
    let improved = true;
    let bestRoute = [...route];
    let bestCost = this.calculateRouteCost(bestRoute, matrix);

    while (improved) {
      improved = false;

      for (let i = 1; i < route.length - 2; i++) {
        for (let j = i + 1; j < route.length - 1; j++) {
          const newRoute = this.swap2Opt(bestRoute, i, j);
          const newCost = this.calculateRouteCost(newRoute, matrix);

          if (newCost < bestCost) {
            bestRoute = newRoute;
            bestCost = newCost;
            improved = true;
          }
        }
      }
    }

    return bestRoute;
  }

  private static swap2Opt(route: string[], i: number, j: number): string[] {
    const newRoute = [...route];
    const segment = newRoute.slice(i, j + 1).reverse();
    newRoute.splice(i, j - i + 1, ...segment);
    return newRoute;
  }

  private static calculateRouteCost(route: string[], matrix: DistanceMatrix): number {
    let cost = 0;
    for (let i = 0; i < route.length - 1; i++) {
      cost += this.calculateCost(route[i], route[i + 1], matrix);
    }
    return cost;
  }
}