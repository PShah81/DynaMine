import Player from "../player/Player";
import SlimeStateManager from "./SlimeStateManager";
import Slime from "./Slime";
import PlayerStateManager from "~/player/PlayerStateManager";
export enum States{
    IDLE = 0,
    WALK = 1,
    JUMP = 2,
    FALL = 3,
    LAND = 4,
    ATTACK = 5,
    DEATH = 6
}
export enum Directions {
    LEFT = 0,
    RIGHT = 1,
    IDLE = 2
}

export class SlimeState {
    player: Player
    slime: Slime
    direction?: Directions
    SlimeStateManager: SlimeStateManager
    constructor(player: Player, slime: Slime, SlimeStateManager: SlimeStateManager) {
        this.player = player;
        this.slime = slime;
        this.SlimeStateManager = SlimeStateManager;
    }
    enter(direction: Directions)
    {

    }
    update() {}
    exit(exitState: States) {}
    findFollowDirection()
    {
        if(this.player.body && this.slime.body)
        {
            let playerPos = this.player.body.center;
            let slimePos = this.slime.body.center;
            let distancePlayerAndSlime = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, slimePos.x, slimePos.y);
            
            if(distancePlayerAndSlime < 200)
            {
                let direction = Directions.IDLE;
                let xDifference = playerPos.x - slimePos.x;
                //Use threshold to allow slime to settle into idle state
                let threshold = 1;
                if(xDifference < threshold*-1)
                {
                    direction = Directions.LEFT;
                }
                else if(xDifference > threshold)
                {
                    direction = Directions.RIGHT;
                }
                return direction;
            }
            else
            {
                return Directions.IDLE;
            }
        }
        else
        {
            console.error("No player or slime body");
            return Directions.IDLE;
        }
    }
    slimeOnFloor()
    {
        if(this.slime.body)
        {
            if(this.slime.body instanceof Phaser.Physics.Arcade.Body && this.slime.body.onFloor())
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        else
        {
            console.error("No Body");
            return false;
        }
    }
    moveHorizontally(direction: Directions)
    {
        if(direction == Directions.RIGHT)
        {
            this.slime.setFlipX(true);
            this.slime.setVelocityX(50);
        }
        else if(direction == Directions.LEFT)
        {
            this.slime.setFlipX(false);
            this.slime.setVelocityX(-50);
        }
        else
        {
            this.slime.setVelocityX(0);
        }
    }
    checkAttackable()
    {
        if(this.player.body && this.slime.body)
        {
            let playerPos = this.player.body.center;
            let slimePos = this.slime.body.center;
            let distancePlayerAndSlime = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, slimePos.x, slimePos.y);
            if(distancePlayerAndSlime < 40)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        else
        {
            console.error("No player or slime body");
            return false;
        }

    }
}

export class Idle extends SlimeState {
    constructor(player: Player, slime: Slime, SlimeStateManager: SlimeStateManager) {
        super(player, slime, SlimeStateManager);
    }
    enter(direction: Directions)
    {
        this.slime.setVelocityX(0);
        this.slime.anims.play("slime_idle", true);
    }
    update()
    {
        let state = States.IDLE;
        let direction = this.findFollowDirection();
        if(this.checkAttackable())
        {
            state = States.ATTACK;
        }
        else if(direction != Directions.IDLE)
        {
            state = States.WALK;
        }
        this.SlimeStateManager.changeState(state, direction);
    }
}

export class Walk extends SlimeState {
    constructor(player: Player, slime: Slime, SlimeStateManager: SlimeStateManager) {
        super(player, slime, SlimeStateManager);
    }
    enter(direction: Directions)
    {
        this.moveHorizontally(direction);
        this.slime.anims.play("slime_walk", true);
        
    }
    update()
    {
        let state = States.IDLE;
        let direction = this.findFollowDirection();
        if(this.checkAttackable())
        {
            state = States.ATTACK;
        }
        else if(direction != Directions.IDLE)
        {
            if(Math.random()*10 < 2 && this.slimeOnFloor())
            {
                state = States.JUMP;
            }
            else
            {
                state = States.WALK;
            }
        }
        this.SlimeStateManager.changeState(state, direction);
    }
}

export class Jump extends SlimeState {
    constructor(player: Player, slime: Slime, SlimeStateManager: SlimeStateManager) {
        super(player, slime, SlimeStateManager);
    }
    enter(direction: Directions)
    {
        this.moveHorizontally(direction);
        this.slime.setVelocityY(-200);
        this.slime.anims.play("slime_jump", true);
        
    }
    update()
    {
        let state = States.JUMP;
        let direction = this.findFollowDirection();
        this.moveHorizontally(direction);
        if(this.checkAttackable())
        {
            state = States.ATTACK;
        }
        else if(this.slime.body && this.slime.body.velocity.y > -20)
        {
            state = States.FALL;
        }

        //Don't want to recall jump and call enter method again
        if(state != States.JUMP)
        {
            this.SlimeStateManager.changeState(state, direction);
        }
    }
}

export class Fall extends SlimeState {
    constructor(player: Player, slime: Slime, SlimeStateManager: SlimeStateManager) {
        super(player, slime, SlimeStateManager);
    }
    enter(direction: Directions)
    {
        this.moveHorizontally(direction);
        this.slime.anims.play("slime_fall", true);
        
    }
    update()
    {
        let state = States.FALL;
        let direction = this.findFollowDirection();
        this.moveHorizontally(direction);
        //In this one case landing gets more priority
        if(this.slimeOnFloor())
        {
            state = States.LAND;
        }
        else if(this.checkAttackable())
        {
            state = States.ATTACK;
        }

        //Don't want to recall fall and call enter method again
        if(state != States.FALL)
        {
            this.SlimeStateManager.changeState(state, direction);
        }
    }
}

export class Land extends SlimeState {
    finishedAnimation: boolean
    constructor(player: Player, slime: Slime, SlimeStateManager: SlimeStateManager) {
        super(player, slime, SlimeStateManager);
        this.finishedAnimation = false;
    }
    enter(direction: Directions)
    {
        this.moveHorizontally(direction);
        this.slime.anims.play("slime_land", true).on('animationcomplete-slime_land', 
        ()=>{this.finishedAnimation = true}, this);
    }
    update()
    {
        if(this.finishedAnimation)
        {
            let state = States.IDLE;
            let direction = this.findFollowDirection();
            if(this.checkAttackable())
            {
                state = States.ATTACK;
            }
            else if(direction != Directions.IDLE)
            {
                state = States.WALK;
            }
            this.SlimeStateManager.changeState(state, direction);
        }
    }
}

export class Attack extends SlimeState {
    finishedAnimation: boolean
    constructor(player: Player, slime: Slime, SlimeStateManager: SlimeStateManager) {
        super(player, slime, SlimeStateManager);
        this.finishedAnimation = false;
    }
    enter(direction: Directions)
    {
        this.moveHorizontally(direction);
        if(this.slime.body)
        {
            this.slime.body.setSize(32,24,false);
        }
        else
        {
            console.error("No Body");
        }
        this.slime.anims.play("slime_attack", true).on('animationcomplete-slime_attack', 
        ()=>{this.finishedAnimation = true}, this);
    }
    update()
    {
        if(this.finishedAnimation)
        {
            let state = States.IDLE;
            let direction = this.findFollowDirection();
            if(direction != Directions.IDLE)
            {
                state = States.WALK;
            }
            this.SlimeStateManager.changeState(state, direction);
        }
    }
    exit(exitState: States)
    {
        if(this.slime.body)
        {
            this.slime.body.setSize(16,16);
            this.slime.body.setOffset(0,0);
        }
        else
        {
            console.error("No Body");
        }
        this.finishedAnimation = false;
    }
}

export class Death extends SlimeState {
    constructor(player: Player, slime: Slime, SlimeStateManager: SlimeStateManager) {
        super(player, slime, SlimeStateManager);
    }
    enter(direction: Directions)
    {
        this.slime.anims.play("slime_death", true).on('animationcomplete-slime_death', 
        ()=>{this.slime.destroy()}, this);
    }
    update()
    {
        
    }
}