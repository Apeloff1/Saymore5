// ========== GO FISH! ADVANCED AI & FISH BEHAVIOR SYSTEM ==========
// Comprehensive AI system for realistic fish behavior and game intelligence
// ~1500+ lines of advanced AI logic

import { useCallback, useRef, useEffect, useState, useMemo } from 'react';

// ========== FISH AI BRAIN SYSTEM ==========

/**
 * Neural network-inspired decision making for fish AI
 * Simulates realistic fish behavior patterns
 */
class FishBrain {
  constructor(fishType, difficulty = 1) {
    this.fishType = fishType;
    this.difficulty = difficulty;
    this.memory = [];
    this.maxMemory = 50;
    this.mood = 'neutral'; // hungry, scared, curious, neutral, aggressive
    this.energy = 100;
    this.hunger = 50;
    this.awareness = 0.5;
    this.lastAction = null;
    this.actionCooldown = 0;
    
    // Personality traits (0-1 scale)
    this.traits = {
      aggression: Math.random() * 0.5 + fishType.baseAggression || 0.3,
      curiosity: Math.random() * 0.5 + fishType.baseCuriosity || 0.5,
      caution: Math.random() * 0.5 + fishType.baseCaution || 0.4,
      persistence: Math.random() * 0.5 + fishType.basePersistence || 0.5,
      intelligence: Math.random() * 0.3 + fishType.baseIntelligence || 0.3,
    };
    
    // State machine
    this.state = 'idle';
    this.stateTimer = 0;
    this.target = null;
    
    // Movement parameters
    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.acceleration = { x: 0, y: 0, z: 0 };
    this.maxSpeed = fishType.maxSpeed || 5;
    this.turnRate = fishType.turnRate || 0.1;
    
    // Sensory system
    this.senses = {
      visionRange: fishType.visionRange || 100,
      visionAngle: fishType.visionAngle || 120,
      hearingRange: fishType.hearingRange || 150,
      smellRange: fishType.smellRange || 200,
      lateralLineRange: fishType.lateralLineRange || 50,
    };
  }
  
  /**
   * Main update loop for fish AI
   */
  update(deltaTime, environment) {
    this.actionCooldown = Math.max(0, this.actionCooldown - deltaTime);
    this.stateTimer += deltaTime;
    
    // Update needs
    this.updateNeeds(deltaTime);
    
    // Process sensory input
    const sensoryData = this.processSenses(environment);
    
    // Update mood based on needs and environment
    this.updateMood(sensoryData);
    
    // State machine logic
    this.updateState(sensoryData, deltaTime);
    
    // Execute behavior based on current state
    this.executeBehavior(sensoryData, deltaTime);
    
    // Apply physics
    this.applyPhysics(deltaTime);
    
    // Store in memory
    this.remember({
      timestamp: Date.now(),
      state: this.state,
      mood: this.mood,
      position: { ...this.position },
      sensoryData: sensoryData.summary,
    });
    
    return {
      position: this.position,
      velocity: this.velocity,
      state: this.state,
      mood: this.mood,
      action: this.lastAction,
    };
  }
  
  /**
   * Update fish needs over time
   */
  updateNeeds(deltaTime) {
    // Energy decreases over time, faster when moving
    const speed = Math.sqrt(
      this.velocity.x ** 2 + 
      this.velocity.y ** 2 + 
      this.velocity.z ** 2
    );
    const energyDrain = 0.01 + speed * 0.005;
    this.energy = Math.max(0, this.energy - energyDrain * deltaTime);
    
    // Hunger increases over time
    this.hunger = Math.min(100, this.hunger + 0.02 * deltaTime);
    
    // Recovery when resting
    if (this.state === 'resting') {
      this.energy = Math.min(100, this.energy + 0.1 * deltaTime);
    }
  }
  
  /**
   * Process all sensory inputs
   */
  processSenses(environment) {
    const result = {
      visibleObjects: [],
      audibleSounds: [],
      detectedScents: [],
      waterPressureChanges: [],
      threats: [],
      food: [],
      mates: [],
      summary: {},
    };
    
    // Process vision
    if (environment.objects) {
      environment.objects.forEach(obj => {
        const distance = this.calculateDistance(obj.position);
        const angle = this.calculateAngle(obj.position);
        
        if (distance <= this.senses.visionRange && 
            Math.abs(angle) <= this.senses.visionAngle / 2) {
          result.visibleObjects.push({
            ...obj,
            distance,
            angle,
            visibility: this.calculateVisibility(obj, distance),
          });
        }
      });
    }
    
    // Process sounds
    if (environment.sounds) {
      environment.sounds.forEach(sound => {
        const distance = this.calculateDistance(sound.position);
        if (distance <= this.senses.hearingRange) {
          result.audibleSounds.push({
            ...sound,
            distance,
            intensity: sound.volume * (1 - distance / this.senses.hearingRange),
          });
        }
      });
    }
    
    // Process scents (lures, bait)
    if (environment.scents) {
      environment.scents.forEach(scent => {
        const distance = this.calculateDistance(scent.position);
        if (distance <= this.senses.smellRange) {
          result.detectedScents.push({
            ...scent,
            distance,
            strength: scent.intensity * (1 - distance / this.senses.smellRange),
          });
        }
      });
    }
    
    // Lateral line detection (water pressure)
    if (environment.disturbances) {
      environment.disturbances.forEach(dist => {
        const distance = this.calculateDistance(dist.position);
        if (distance <= this.senses.lateralLineRange) {
          result.waterPressureChanges.push({
            ...dist,
            distance,
            intensity: dist.magnitude * (1 - distance / this.senses.lateralLineRange),
          });
        }
      });
    }
    
    // Categorize detected objects
    result.visibleObjects.forEach(obj => {
      if (obj.type === 'predator' || obj.type === 'threat') {
        result.threats.push(obj);
      } else if (obj.type === 'food' || obj.type === 'lure' || obj.type === 'bait') {
        result.food.push(obj);
      } else if (obj.type === 'mate') {
        result.mates.push(obj);
      }
    });
    
    // Create summary
    result.summary = {
      threatLevel: this.calculateThreatLevel(result.threats),
      foodAvailable: result.food.length > 0,
      closestFood: result.food.sort((a, b) => a.distance - b.distance)[0],
      closestThreat: result.threats.sort((a, b) => a.distance - b.distance)[0],
      environmentNoise: result.audibleSounds.reduce((sum, s) => sum + s.intensity, 0),
      waterActivity: result.waterPressureChanges.reduce((sum, w) => sum + w.intensity, 0),
    };
    
    return result;
  }
  
  /**
   * Update mood based on needs and sensory input
   */
  updateMood(sensoryData) {
    const { threatLevel, foodAvailable, closestFood } = sensoryData.summary;
    
    // Priority: survival > hunger > curiosity > rest
    if (threatLevel > 0.7) {
      this.mood = 'scared';
    } else if (this.hunger > 80 && foodAvailable) {
      this.mood = 'hungry';
    } else if (threatLevel > 0.3) {
      this.mood = 'cautious';
    } else if (this.energy < 30) {
      this.mood = 'tired';
    } else if (closestFood && this.traits.curiosity > 0.5) {
      this.mood = 'curious';
    } else if (this.traits.aggression > 0.7 && this.energy > 70) {
      this.mood = 'aggressive';
    } else {
      this.mood = 'neutral';
    }
  }
  
  /**
   * State machine transitions
   */
  updateState(sensoryData, deltaTime) {
    const { summary } = sensoryData;
    const previousState = this.state;
    
    switch (this.state) {
      case 'idle':
        if (summary.threatLevel > 0.5) {
          this.state = 'fleeing';
        } else if (this.mood === 'hungry' && summary.foodAvailable) {
          this.state = 'hunting';
        } else if (this.energy < 20) {
          this.state = 'resting';
        } else if (Math.random() < 0.01 * deltaTime) {
          this.state = 'wandering';
        }
        break;
        
      case 'wandering':
        if (summary.threatLevel > 0.5) {
          this.state = 'fleeing';
        } else if (this.mood === 'hungry' && summary.foodAvailable) {
          this.state = 'hunting';
        } else if (this.stateTimer > 5000 + Math.random() * 5000) {
          this.state = 'idle';
        }
        break;
        
      case 'hunting':
        if (summary.threatLevel > 0.7) {
          this.state = 'fleeing';
        } else if (!summary.foodAvailable) {
          this.state = 'searching';
        } else if (summary.closestFood && summary.closestFood.distance < 10) {
          this.state = 'striking';
        }
        break;
        
      case 'striking':
        if (this.stateTimer > 500) {
          this.state = summary.foodAvailable ? 'hunting' : 'idle';
        }
        break;
        
      case 'fleeing':
        if (summary.threatLevel < 0.2 && this.stateTimer > 3000) {
          this.state = 'cautious_return';
        }
        break;
        
      case 'cautious_return':
        if (summary.threatLevel > 0.5) {
          this.state = 'fleeing';
        } else if (this.stateTimer > 5000) {
          this.state = 'idle';
        }
        break;
        
      case 'resting':
        if (summary.threatLevel > 0.6) {
          this.state = 'fleeing';
        } else if (this.energy > 80) {
          this.state = 'idle';
        }
        break;
        
      case 'searching':
        if (summary.threatLevel > 0.5) {
          this.state = 'fleeing';
        } else if (summary.foodAvailable) {
          this.state = 'hunting';
        } else if (this.stateTimer > 10000) {
          this.state = 'idle';
        }
        break;
        
      case 'investigating':
        if (summary.threatLevel > 0.5) {
          this.state = 'fleeing';
        } else if (this.stateTimer > 3000) {
          this.state = this.mood === 'hungry' ? 'hunting' : 'idle';
        }
        break;
        
      default:
        this.state = 'idle';
    }
    
    // Reset timer on state change
    if (previousState !== this.state) {
      this.stateTimer = 0;
      this.lastAction = `transition_${previousState}_to_${this.state}`;
    }
  }
  
  /**
   * Execute behavior based on current state
   */
  executeBehavior(sensoryData, deltaTime) {
    const { summary } = sensoryData;
    
    switch (this.state) {
      case 'idle':
        this.behaviorIdle(deltaTime);
        break;
        
      case 'wandering':
        this.behaviorWander(deltaTime);
        break;
        
      case 'hunting':
        this.behaviorHunt(summary.closestFood, deltaTime);
        break;
        
      case 'striking':
        this.behaviorStrike(summary.closestFood, deltaTime);
        break;
        
      case 'fleeing':
        this.behaviorFlee(summary.closestThreat, deltaTime);
        break;
        
      case 'cautious_return':
        this.behaviorCautiousReturn(deltaTime);
        break;
        
      case 'resting':
        this.behaviorRest(deltaTime);
        break;
        
      case 'searching':
        this.behaviorSearch(deltaTime);
        break;
        
      case 'investigating':
        this.behaviorInvestigate(this.target, deltaTime);
        break;
    }
  }
  
  // ========== BEHAVIOR IMPLEMENTATIONS ==========
  
  behaviorIdle(deltaTime) {
    // Gentle hovering motion
    this.acceleration.x = (Math.random() - 0.5) * 0.1;
    this.acceleration.y = Math.sin(Date.now() * 0.001) * 0.05;
    this.acceleration.z = (Math.random() - 0.5) * 0.1;
    
    // Slow down
    this.velocity.x *= 0.98;
    this.velocity.y *= 0.98;
    this.velocity.z *= 0.98;
  }
  
  behaviorWander(deltaTime) {
    // Random direction changes
    if (Math.random() < 0.02) {
      this.target = {
        x: this.position.x + (Math.random() - 0.5) * 200,
        y: this.position.y + (Math.random() - 0.5) * 100,
        z: this.position.z + (Math.random() - 0.5) * 200,
      };
    }
    
    if (this.target) {
      this.moveToward(this.target, this.maxSpeed * 0.3, deltaTime);
    }
  }
  
  behaviorHunt(food, deltaTime) {
    if (!food) {
      this.state = 'searching';
      return;
    }
    
    const distance = this.calculateDistance(food.position);
    
    // Approach speed based on distance
    let approachSpeed = this.maxSpeed * 0.5;
    if (distance < 50) {
      approachSpeed = this.maxSpeed * 0.3; // Slow approach
    }
    if (distance < 20) {
      approachSpeed = this.maxSpeed * 0.8; // Quick final approach
    }
    
    // Intelligence affects hunting pattern
    if (this.traits.intelligence > 0.5 && distance < 100) {
      // Smart fish circle the prey
      const circleOffset = {
        x: Math.cos(Date.now() * 0.002) * 30,
        y: 0,
        z: Math.sin(Date.now() * 0.002) * 30,
      };
      const adjustedTarget = {
        x: food.position.x + circleOffset.x,
        y: food.position.y + circleOffset.y,
        z: food.position.z + circleOffset.z,
      };
      this.moveToward(adjustedTarget, approachSpeed, deltaTime);
    } else {
      // Direct approach
      this.moveToward(food.position, approachSpeed, deltaTime);
    }
  }
  
  behaviorStrike(food, deltaTime) {
    if (!food) return;
    
    // Burst of speed toward food
    this.moveToward(food.position, this.maxSpeed * 1.5, deltaTime);
    
    // Check if caught
    const distance = this.calculateDistance(food.position);
    if (distance < 5) {
      this.lastAction = 'bite';
      this.hunger = Math.max(0, this.hunger - 30);
      this.energy = Math.min(100, this.energy + 10);
    }
  }
  
  behaviorFlee(threat, deltaTime) {
    if (!threat) {
      // Flee in random direction
      const fleeDirection = {
        x: this.position.x + (Math.random() - 0.5) * 200,
        y: this.position.y + (Math.random() - 0.3) * 50,
        z: this.position.z + (Math.random() - 0.5) * 200,
      };
      this.moveToward(fleeDirection, this.maxSpeed, deltaTime);
      return;
    }
    
    // Flee away from threat
    const dx = this.position.x - threat.position.x;
    const dy = this.position.y - threat.position.y;
    const dz = this.position.z - threat.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    
    const fleeTarget = {
      x: this.position.x + (dx / dist) * 100,
      y: this.position.y + (dy / dist) * 50,
      z: this.position.z + (dz / dist) * 100,
    };
    
    this.moveToward(fleeTarget, this.maxSpeed * 1.2, deltaTime);
  }
  
  behaviorCautiousReturn(deltaTime) {
    // Slow, careful movement back to normal area
    const homePosition = { x: 0, y: -50, z: 0 };
    this.moveToward(homePosition, this.maxSpeed * 0.2, deltaTime);
    
    // Occasional pauses to check surroundings
    if (Math.random() < 0.01) {
      this.velocity.x *= 0.5;
      this.velocity.y *= 0.5;
      this.velocity.z *= 0.5;
    }
  }
  
  behaviorRest(deltaTime) {
    // Find a spot and stay there
    this.velocity.x *= 0.95;
    this.velocity.y *= 0.95;
    this.velocity.z *= 0.95;
    
    // Gentle fin movements
    this.acceleration.y = Math.sin(Date.now() * 0.0005) * 0.02;
  }
  
  behaviorSearch(deltaTime) {
    // Systematic search pattern
    const searchRadius = 150;
    const searchAngle = (Date.now() * 0.001) % (Math.PI * 2);
    
    const searchTarget = {
      x: this.position.x + Math.cos(searchAngle) * searchRadius * 0.1,
      y: this.position.y + Math.sin(Date.now() * 0.0005) * 20,
      z: this.position.z + Math.sin(searchAngle) * searchRadius * 0.1,
    };
    
    this.moveToward(searchTarget, this.maxSpeed * 0.4, deltaTime);
  }
  
  behaviorInvestigate(target, deltaTime) {
    if (!target) {
      this.state = 'idle';
      return;
    }
    
    const distance = this.calculateDistance(target.position);
    
    // Cautious approach
    if (distance > 30) {
      this.moveToward(target.position, this.maxSpeed * 0.3, deltaTime);
    } else {
      // Circle around the object
      const circleAngle = Date.now() * 0.002;
      const circleTarget = {
        x: target.position.x + Math.cos(circleAngle) * 25,
        y: target.position.y,
        z: target.position.z + Math.sin(circleAngle) * 25,
      };
      this.moveToward(circleTarget, this.maxSpeed * 0.2, deltaTime);
    }
  }
  
  // ========== UTILITY METHODS ==========
  
  moveToward(target, speed, deltaTime) {
    const dx = target.x - this.position.x;
    const dy = target.y - this.position.y;
    const dz = target.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    
    // Desired velocity
    const desiredVx = (dx / dist) * speed;
    const desiredVy = (dy / dist) * speed;
    const desiredVz = (dz / dist) * speed;
    
    // Steering force (smooth turning)
    this.acceleration.x = (desiredVx - this.velocity.x) * this.turnRate;
    this.acceleration.y = (desiredVy - this.velocity.y) * this.turnRate;
    this.acceleration.z = (desiredVz - this.velocity.z) * this.turnRate;
  }
  
  applyPhysics(deltaTime) {
    const dt = deltaTime / 1000;
    
    // Apply acceleration
    this.velocity.x += this.acceleration.x * dt;
    this.velocity.y += this.acceleration.y * dt;
    this.velocity.z += this.acceleration.z * dt;
    
    // Clamp velocity
    const speed = Math.sqrt(
      this.velocity.x ** 2 + 
      this.velocity.y ** 2 + 
      this.velocity.z ** 2
    );
    
    if (speed > this.maxSpeed) {
      const scale = this.maxSpeed / speed;
      this.velocity.x *= scale;
      this.velocity.y *= scale;
      this.velocity.z *= scale;
    }
    
    // Apply velocity
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;
    
    // Water drag
    this.velocity.x *= 0.99;
    this.velocity.y *= 0.99;
    this.velocity.z *= 0.99;
    
    // Reset acceleration
    this.acceleration.x = 0;
    this.acceleration.y = 0;
    this.acceleration.z = 0;
  }
  
  calculateDistance(targetPos) {
    const dx = targetPos.x - this.position.x;
    const dy = targetPos.y - this.position.y;
    const dz = targetPos.z - this.position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  calculateAngle(targetPos) {
    const dx = targetPos.x - this.position.x;
    const dz = targetPos.z - this.position.z;
    return Math.atan2(dz, dx) * (180 / Math.PI);
  }
  
  calculateVisibility(obj, distance) {
    let visibility = 1 - (distance / this.senses.visionRange);
    
    // Factors affecting visibility
    if (obj.camouflage) visibility *= (1 - obj.camouflage);
    if (obj.size) visibility *= Math.min(1, obj.size / 10);
    if (obj.movement) visibility *= (1 + obj.movement * 0.5);
    
    return Math.max(0, Math.min(1, visibility));
  }
  
  calculateThreatLevel(threats) {
    if (threats.length === 0) return 0;
    
    let maxThreat = 0;
    threats.forEach(threat => {
      const distanceFactor = 1 - (threat.distance / this.senses.visionRange);
      const sizeFactor = threat.size ? threat.size / 50 : 0.5;
      const threatValue = distanceFactor * sizeFactor * (threat.dangerLevel || 0.5);
      maxThreat = Math.max(maxThreat, threatValue);
    });
    
    return Math.min(1, maxThreat);
  }
  
  remember(event) {
    this.memory.push(event);
    if (this.memory.length > this.maxMemory) {
      this.memory.shift();
    }
  }
  
  recallSimilar(currentSituation) {
    // Find similar past experiences
    return this.memory.filter(mem => {
      return mem.state === currentSituation.state &&
             mem.mood === currentSituation.mood;
    });
  }
}

// ========== FISH SCHOOL BEHAVIOR ==========

/**
 * Manages group behavior for schooling fish
 */
class FishSchool {
  constructor(fishType, count = 10) {
    this.fishType = fishType;
    this.members = [];
    this.center = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    
    // School parameters
    this.cohesionWeight = 1.0;
    this.separationWeight = 1.5;
    this.alignmentWeight = 1.0;
    this.avoidanceWeight = 2.0;
    
    // Distances
    this.neighborRadius = 50;
    this.separationRadius = 15;
    this.predatorRadius = 100;
    
    // Initialize members
    for (let i = 0; i < count; i++) {
      this.members.push(new SchoolMember(fishType, i));
    }
  }
  
  update(deltaTime, environment) {
    // Calculate school center
    this.calculateCenter();
    
    // Update each member
    this.members.forEach(member => {
      const neighbors = this.getNeighbors(member);
      const forces = this.calculateForces(member, neighbors, environment);
      member.applyForces(forces, deltaTime);
    });
    
    // Update school velocity
    this.calculateVelocity();
    
    return this.members.map(m => ({
      position: m.position,
      velocity: m.velocity,
      rotation: m.rotation,
    }));
  }
  
  calculateCenter() {
    let sumX = 0, sumY = 0, sumZ = 0;
    this.members.forEach(m => {
      sumX += m.position.x;
      sumY += m.position.y;
      sumZ += m.position.z;
    });
    const count = this.members.length;
    this.center = {
      x: sumX / count,
      y: sumY / count,
      z: sumZ / count,
    };
  }
  
  calculateVelocity() {
    let sumVx = 0, sumVy = 0, sumVz = 0;
    this.members.forEach(m => {
      sumVx += m.velocity.x;
      sumVy += m.velocity.y;
      sumVz += m.velocity.z;
    });
    const count = this.members.length;
    this.velocity = {
      x: sumVx / count,
      y: sumVy / count,
      z: sumVz / count,
    };
  }
  
  getNeighbors(member) {
    return this.members.filter(other => {
      if (other === member) return false;
      const dist = this.distance(member.position, other.position);
      return dist < this.neighborRadius;
    });
  }
  
  calculateForces(member, neighbors, environment) {
    const forces = {
      cohesion: { x: 0, y: 0, z: 0 },
      separation: { x: 0, y: 0, z: 0 },
      alignment: { x: 0, y: 0, z: 0 },
      avoidance: { x: 0, y: 0, z: 0 },
    };
    
    if (neighbors.length === 0) {
      // Move toward school center
      forces.cohesion = this.normalize(this.subtract(this.center, member.position));
      return forces;
    }
    
    // Cohesion - move toward average position of neighbors
    let avgPos = { x: 0, y: 0, z: 0 };
    neighbors.forEach(n => {
      avgPos.x += n.position.x;
      avgPos.y += n.position.y;
      avgPos.z += n.position.z;
    });
    avgPos.x /= neighbors.length;
    avgPos.y /= neighbors.length;
    avgPos.z /= neighbors.length;
    forces.cohesion = this.scale(
      this.normalize(this.subtract(avgPos, member.position)),
      this.cohesionWeight
    );
    
    // Separation - avoid crowding neighbors
    neighbors.forEach(n => {
      const dist = this.distance(member.position, n.position);
      if (dist < this.separationRadius && dist > 0) {
        const away = this.normalize(this.subtract(member.position, n.position));
        const strength = (this.separationRadius - dist) / this.separationRadius;
        forces.separation.x += away.x * strength * this.separationWeight;
        forces.separation.y += away.y * strength * this.separationWeight;
        forces.separation.z += away.z * strength * this.separationWeight;
      }
    });
    
    // Alignment - match velocity with neighbors
    let avgVel = { x: 0, y: 0, z: 0 };
    neighbors.forEach(n => {
      avgVel.x += n.velocity.x;
      avgVel.y += n.velocity.y;
      avgVel.z += n.velocity.z;
    });
    avgVel.x /= neighbors.length;
    avgVel.y /= neighbors.length;
    avgVel.z /= neighbors.length;
    forces.alignment = this.scale(this.normalize(avgVel), this.alignmentWeight);
    
    // Predator avoidance
    if (environment.threats) {
      environment.threats.forEach(threat => {
        const dist = this.distance(member.position, threat.position);
        if (dist < this.predatorRadius) {
          const away = this.normalize(this.subtract(member.position, threat.position));
          const strength = Math.pow((this.predatorRadius - dist) / this.predatorRadius, 2);
          forces.avoidance.x += away.x * strength * this.avoidanceWeight;
          forces.avoidance.y += away.y * strength * this.avoidanceWeight;
          forces.avoidance.z += away.z * strength * this.avoidanceWeight;
        }
      });
    }
    
    return forces;
  }
  
  // Vector math helpers
  distance(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  subtract(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }
  
  normalize(v) {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }
  
  scale(v, s) {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
  }
}

/**
 * Individual member of a fish school
 */
class SchoolMember {
  constructor(fishType, index) {
    this.fishType = fishType;
    this.index = index;
    
    // Random starting position
    this.position = {
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 50,
      z: (Math.random() - 0.5) * 100,
    };
    
    this.velocity = {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 1,
      z: (Math.random() - 0.5) * 2,
    };
    
    this.acceleration = { x: 0, y: 0, z: 0 };
    this.rotation = Math.random() * Math.PI * 2;
    this.maxSpeed = fishType.maxSpeed || 3;
    this.maxForce = 0.1;
  }
  
  applyForces(forces, deltaTime) {
    // Sum all forces
    this.acceleration.x = forces.cohesion.x + forces.separation.x + 
                          forces.alignment.x + forces.avoidance.x;
    this.acceleration.y = forces.cohesion.y + forces.separation.y + 
                          forces.alignment.y + forces.avoidance.y;
    this.acceleration.z = forces.cohesion.z + forces.separation.z + 
                          forces.alignment.z + forces.avoidance.z;
    
    // Limit force
    const forceMag = Math.sqrt(
      this.acceleration.x ** 2 + 
      this.acceleration.y ** 2 + 
      this.acceleration.z ** 2
    );
    if (forceMag > this.maxForce) {
      this.acceleration.x = (this.acceleration.x / forceMag) * this.maxForce;
      this.acceleration.y = (this.acceleration.y / forceMag) * this.maxForce;
      this.acceleration.z = (this.acceleration.z / forceMag) * this.maxForce;
    }
    
    // Update velocity
    const dt = deltaTime / 1000;
    this.velocity.x += this.acceleration.x * dt * 60;
    this.velocity.y += this.acceleration.y * dt * 60;
    this.velocity.z += this.acceleration.z * dt * 60;
    
    // Limit speed
    const speed = Math.sqrt(
      this.velocity.x ** 2 + 
      this.velocity.y ** 2 + 
      this.velocity.z ** 2
    );
    if (speed > this.maxSpeed) {
      this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
      this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
      this.velocity.z = (this.velocity.z / speed) * this.maxSpeed;
    }
    
    // Update position
    this.position.x += this.velocity.x * dt * 60;
    this.position.y += this.velocity.y * dt * 60;
    this.position.z += this.velocity.z * dt * 60;
    
    // Update rotation to face movement direction
    this.rotation = Math.atan2(this.velocity.z, this.velocity.x);
    
    // Reset acceleration
    this.acceleration = { x: 0, y: 0, z: 0 };
  }
}

// ========== BITE DECISION SYSTEM ==========

/**
 * Determines if and when a fish will bite the lure
 */
class BiteDecisionEngine {
  constructor() {
    this.factors = {
      lureAttraction: 1.0,
      fishHunger: 1.0,
      fishMood: 1.0,
      timeOfDay: 1.0,
      weather: 1.0,
      waterTemp: 1.0,
      waterClarity: 1.0,
      lureMovement: 1.0,
      previousExperience: 1.0,
      competitionNearby: 1.0,
    };
  }
  
  calculateBiteChance(fish, lure, environment) {
    let baseChance = 0.1; // 10% base chance
    
    // Lure attraction
    const lureBonus = this.evaluateLure(lure, fish);
    baseChance *= (1 + lureBonus);
    
    // Fish state
    const hungerBonus = fish.hunger / 100;
    baseChance *= (0.5 + hungerBonus * 1.5);
    
    // Mood modifier
    const moodModifier = this.getMoodModifier(fish.mood);
    baseChance *= moodModifier;
    
    // Environmental factors
    const envModifier = this.getEnvironmentModifier(environment);
    baseChance *= envModifier;
    
    // Time of day
    const timeModifier = this.getTimeModifier(environment.timeOfDay);
    baseChance *= timeModifier;
    
    // Fish intelligence (smart fish are harder to catch)
    const intelligenceModifier = 1 - (fish.traits?.intelligence || 0.3) * 0.5;
    baseChance *= intelligenceModifier;
    
    // Previous bad experiences
    const experienceModifier = this.getExperienceModifier(fish);
    baseChance *= experienceModifier;
    
    return Math.min(0.95, Math.max(0.01, baseChance));
  }
  
  evaluateLure(lure, fish) {
    let score = 0;
    
    // Color preference
    if (fish.colorPreferences) {
      const colorMatch = fish.colorPreferences.includes(lure.color);
      score += colorMatch ? 0.3 : -0.1;
    }
    
    // Size preference
    const sizeRatio = lure.size / (fish.preferredPreySize || 10);
    if (sizeRatio > 0.5 && sizeRatio < 2) {
      score += 0.2;
    } else {
      score -= 0.2;
    }
    
    // Movement style
    if (lure.movementStyle === fish.preferredMovement) {
      score += 0.25;
    }
    
    // Scent
    if (lure.scented) {
      score += 0.2;
    }
    
    return score;
  }
  
  getMoodModifier(mood) {
    const modifiers = {
      hungry: 2.0,
      aggressive: 1.5,
      curious: 1.2,
      neutral: 1.0,
      cautious: 0.5,
      scared: 0.1,
      tired: 0.3,
    };
    return modifiers[mood] || 1.0;
  }
  
  getEnvironmentModifier(env) {
    let modifier = 1.0;
    
    // Weather effects
    if (env.weather === 'rainy') modifier *= 1.3;
    if (env.weather === 'stormy') modifier *= 0.7;
    if (env.weather === 'cloudy') modifier *= 1.1;
    
    // Water clarity
    if (env.waterClarity < 0.5) modifier *= 0.8;
    
    // Water temperature
    const optimalTemp = 18; // Celsius
    const tempDiff = Math.abs(env.waterTemp - optimalTemp);
    modifier *= Math.max(0.5, 1 - tempDiff * 0.02);
    
    return modifier;
  }
  
  getTimeModifier(timeOfDay) {
    const modifiers = {
      dawn: 1.4,
      day: 0.9,
      noon: 0.7,
      afternoon: 0.9,
      dusk: 1.5,
      night: 1.2,
      midnight: 1.3,
    };
    return modifiers[timeOfDay] || 1.0;
  }
  
  getExperienceModifier(fish) {
    if (!fish.memory || fish.memory.length === 0) return 1.0;
    
    // Check for recent hook experiences
    const recentHookMemory = fish.memory.filter(
      m => m.event === 'hooked' && Date.now() - m.timestamp < 300000
    );
    
    if (recentHookMemory.length > 0) {
      return Math.max(0.1, 1 - recentHookMemory.length * 0.3);
    }
    
    return 1.0;
  }
  
  decideBite(fish, lure, environment) {
    const chance = this.calculateBiteChance(fish, lure, environment);
    const roll = Math.random();
    
    const decision = {
      willBite: roll < chance,
      confidence: chance,
      roll: roll,
      hesitation: chance > 0.5 ? 0 : (1 - chance) * 2000, // ms
      strikeForce: fish.traits?.aggression || 0.5,
      factors: { ...this.factors },
    };
    
    // Smart fish might do a test nibble first
    if (fish.traits?.intelligence > 0.6 && roll < chance * 1.5 && roll >= chance) {
      decision.testNibble = true;
      decision.willBite = false;
    }
    
    return decision;
  }
}

// ========== EXPORTS ==========

export {
  FishBrain,
  FishSchool,
  SchoolMember,
  BiteDecisionEngine,
};

export default {
  FishBrain,
  FishSchool,
  SchoolMember,
  BiteDecisionEngine,
};
