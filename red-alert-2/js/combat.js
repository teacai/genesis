// Combat system
class CombatSystem {
  constructor(game) {
    this.game = game;
    this.projectiles = [];
  }

  attack(attacker, target) {
    if (!attacker.weapon || target.dead) return;
    const weapon = attacker.weapon;

    // Check if weapon can target this unit type
    if (weapon.antiAir && target.def?.type !== 'air') {
      // Some anti-air weapons can also target ground - skip check if no restriction
      if (!weapon.damage) return;
    }

    // Create projectile
    const projSpeed = this._getProjectileSpeed(weapon.type);
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (projSpeed === 0 || dist < 1) {
      // Instant hit (bullets, electric)
      this._applyDamage(attacker, target, weapon);
    } else {
      // Projectile
      this.projectiles.push({
        x: attacker.x, y: attacker.y,
        targetId: target.id,
        targetX: target.x, targetY: target.y,
        speed: projSpeed,
        damage: weapon.damage,
        splash: weapon.splash || 0,
        type: weapon.type,
        playerId: attacker.playerId,
        life: 5, // max lifetime seconds
      });
    }

    // Visual effects
    this.game.addEffect({
      type: 'muzzle_flash',
      x: attacker.x, y: attacker.y,
      duration: 0.1,
      timer: 0,
    });

    // Sound
    this.game.sound?.playAttack(weapon.type);
  }

  _applyDamage(attacker, target, weapon) {
    let damage = weapon.damage;

    // Armor modifiers
    if (target.def?.type === 'infantry' && (weapon.type === 'shell' || weapon.type === 'bomb')) {
      damage *= 1.5; // Explosives are extra effective vs infantry
    }
    if (target.def?.type === 'vehicle' && weapon.type === 'bullet') {
      damage *= 0.5; // Bullets are less effective vs vehicles
    }
    if (target.def?.type === 'air' && !weapon.antiAir && weapon.type !== 'missile') {
      damage *= 0.1; // Most weapons can barely hit air
    }

    target.takeDamage(damage);

    // Splash damage
    if (weapon.splash) {
      const nearby = this.game.entities.getEntitiesNear(target.x, target.y, weapon.splash);
      for (const e of nearby) {
        if (e.id === target.id) continue;
        if (e.playerId === attacker.playerId) continue; // No friendly fire splash
        const dist = Math.sqrt((e.x - target.x) ** 2 + (e.y - target.y) ** 2);
        const falloff = 1 - dist / weapon.splash;
        if (falloff > 0) {
          e.takeDamage(damage * falloff * 0.5);
        }
      }
    }

    // Death effect
    if (target.dead) {
      this.game.addEffect({
        type: 'explosion',
        x: target.x, y: target.y,
        duration: target.type === 'building' ? 1.0 : 0.5,
        timer: 0,
        size: target.type === 'building' ? 2 : 1,
      });
      this.game.sound?.playExplosion(target.type);
    } else {
      this.game.addEffect({
        type: 'hit',
        x: target.x, y: target.y,
        duration: 0.15,
        timer: 0,
      });
    }
  }

  _getProjectileSpeed(type) {
    switch (type) {
      case 'bullet': return 0; // instant
      case 'electric': return 0; // instant
      case 'laser': return 0; // instant
      case 'shell': return 15;
      case 'missile': return 12;
      case 'rocket': return 8;
      case 'torpedo': return 6;
      case 'bomb': return 5;
      case 'flak': return 0; // instant
      default: return 10;
    }
  }

  update(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Track target
      const target = this.game.entities.get(p.targetId);
      if (target && !target.dead) {
        p.targetX = target.x;
        p.targetY = target.y;
      }

      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.5) {
        // Hit
        if (target && !target.dead) {
          this._applyDamage({ playerId: p.playerId, weapon: { damage: p.damage, splash: p.splash, type: p.type } }, target, { damage: p.damage, splash: p.splash, type: p.type });
        } else {
          // Splash at location
          if (p.splash) {
            const nearby = this.game.entities.getEntitiesNear(p.targetX, p.targetY, p.splash);
            for (const e of nearby) {
              if (e.playerId === p.playerId) continue;
              const d = Math.sqrt((e.x - p.targetX) ** 2 + (e.y - p.targetY) ** 2);
              const falloff = 1 - d / p.splash;
              if (falloff > 0) e.takeDamage(p.damage * falloff * 0.5);
            }
          }
          this.game.addEffect({
            type: 'explosion',
            x: p.targetX, y: p.targetY,
            duration: 0.3, timer: 0, size: 0.5,
          });
        }
        this.projectiles.splice(i, 1);
      } else {
        const speed = p.speed * dt;
        p.x += (dx / dist) * speed;
        p.y += (dy / dist) * speed;
      }
    }
  }
}
