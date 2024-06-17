import PlayerStateManager from "./PlayerStateManager";
import Player from "./Player";
import GroundLayer from "../map/GroundLayer";
import ItemLayer from "../map/ItemLayer";

export enum States{
    IDLE = 0,
    WALK = 1,
    RUN = 2,
    MINE = 3,
    JUMP = 4,
    FALL = 5,
    LAND = 6,
    CLIMB = 7,
    ATTACK = 8
}
export enum Directions {
    LEFT = 0,
    RIGHT = 1,
    UP = 2,
    DOWN = 3,
    IDLE = 4
}
export enum Items {
    LADDER = 0,
    TORCH = 1,
    DYNAMITE = 2
}



export class PlayerState {
    player: Player & {body: Phaser.Physics.Arcade.Body}
    PlayerStateManager: PlayerStateManager
    direction?: Directions
    finishedAnimation: Boolean
    GroundLayer: GroundLayer
    ItemLayer: ItemLayer
    constructor(player, PlayerStateManager, GroundLayer, ItemLayer) {
        this.player = player;
        this.PlayerStateManager = PlayerStateManager;
        this.finishedAnimation = false;
        this.GroundLayer = GroundLayer;
        this.ItemLayer = ItemLayer;
    }

    enter(direction) {}
    exit(exitState) {}
    update(cursors, lastKeyPressed) {}
    moveHorizontally(direction)
    {
        let velocity = this.getPlayerVelocity();
        this.player.setAccelerationX(0);
        if(direction == Directions.LEFT)
        {
            this.player.setFlipX(true);
            this.player.setVelocityX(Math.min(-100, velocity.x));
        }
        else
        {
            this.player.setFlipX(false);
            this.player.setVelocityX(Math.max(100, velocity.x));
        }
    }
    craft(lastKeyPressed)
    {
        let itemIndex = -1;
        if(lastKeyPressed == Phaser.Input.Keyboard.KeyCodes.ONE)
        {
            itemIndex = Items.LADDER;
        }
        else if(lastKeyPressed == Phaser.Input.Keyboard.KeyCodes.TWO)
        {
            itemIndex = Items.TORCH;
        }
        if(itemIndex != -1)
        {
            console.log(this.ItemLayer)
            this.ItemLayer.placeItem(itemIndex, this.player);
        }
    }
    dropDynamite(lastKeyPressed)
    {
        if(lastKeyPressed == Phaser.Input.Keyboard.KeyCodes.THREE)
        {
            this.GroundLayer.handleDynamite();
        }
        
    }
    playerOnFloor()
    {
        if(this.player.body.onFloor())
        {
            return true;
        }
        else
        {
            return false;
        }
    }
    getPlayerVelocity()
    {
        return this.player.body.velocity
    }
}

export class Idle extends PlayerState {
    constructor(player, PlayerStateManager, GroundLayer, ItemLayer) {
        super(player, PlayerStateManager, GroundLayer, ItemLayer);
    }
    enter(direction)
    {
        this.player.anims.play("idle", true);
        this.player.setVelocityX(0);
        this.player.setVelocityY(0);
        this.player.setAccelerationX(0);
        this.player.setAccelerationY(0);
    }
    update(cursors, lastKeyPressed)
    {
        let newState;
        let newDirection;

        this.craft(lastKeyPressed);
        this.dropDynamite(lastKeyPressed);

        if (cursors.left.isDown)
        {
            this.GroundLayer.startMining("left");
            if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "left")
            {
                newState = States.MINE;
                newDirection = Directions.LEFT;
            }
            else if(this.playerOnFloor())
            {
                newState = States.WALK;
                newDirection = Directions.LEFT;
            }
        }
        if (cursors.right.isDown)
        {
            this.GroundLayer.startMining("right");
            if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "right")
            {
                newState = States.MINE;
                newDirection = Directions.RIGHT;
            }
            else if(this.playerOnFloor())
            {
                newState = States.WALK;
                newDirection = Directions.RIGHT;
            }
        }

        if(cursors.space.isDown)
        {
            newState = States.ATTACK;
        }

        if(cursors.up.isDown)
        {
            if(this.player.canClimb)
            {
                newState = States.CLIMB;
                newDirection = Directions.UP;
            }
            else if(this.playerOnFloor())
            {
                newState = States.JUMP;
            }
        }
        if(cursors.down.isDown)
        {
            this.GroundLayer.startMining("down");
            if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "down" && this.playerOnFloor())
            {
                newState = States.MINE;
                newDirection = Directions.DOWN;
            }
            else if(this.player.canClimb)
            {
                newState = States.CLIMB;
                newDirection = Directions.DOWN;
            }
        }

        if(!newState)
        {
            newState = States.IDLE;
        }

        this.PlayerStateManager.changeState(newState, newDirection);
    }
}

export class Walk extends PlayerState {
    constructor(player, PlayerStateManager, GroundLayer, ItemLayer) {
        super(player, PlayerStateManager, GroundLayer, ItemLayer);
    }

    enter(direction)
    {
        this.direction = direction;
        if(direction == Directions.LEFT)
        {
            this.moveHorizontally(direction);
            this.player.setAccelerationX(-50);
        }
        else
        {
            this.moveHorizontally(direction);
            this.player.setAccelerationX(50);
        }
        this.player.anims.play("walk", true);
    }
    update(cursors, lastKeyPressed)
    {
        let newState;
        let newDirection;
        let velocity = this.getPlayerVelocity();

        this.craft(lastKeyPressed);
        this.dropDynamite(lastKeyPressed);

        if (cursors.left.isDown)
        {
            this.GroundLayer.startMining("left");
            if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "left")
            {
                newState = States.MINE;
                newDirection = Directions.LEFT;
            }
            else if(this.playerOnFloor())
            {
                if(velocity.x < -200)
                {
                    newState = States.RUN;
                    newDirection = Directions.LEFT;
                }
                else
                {
                    newState = States.WALK;
                    newDirection = Directions.LEFT;
                }
            }
        }
        if (cursors.right.isDown)
        {
            this.GroundLayer.startMining("right");
            if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "right")
            {
                newState = States.MINE;
                newDirection = Directions.RIGHT;
            }
            else if(this.playerOnFloor())
            {
                if(velocity.x > 200)
                {
                    newState = States.RUN;
                    newDirection = Directions.RIGHT;
                }
                else
                {
                    newState = States.WALK;
                    newDirection = Directions.RIGHT;
                }
            }
        }

        if(cursors.space.isDown)
        {
            newState = States.ATTACK;
        }

        if(cursors.up.isDown)
        {
            if(this.player.canClimb)
            {
                newState = States.CLIMB;
                newDirection = Directions.UP;
            }
            else if(this.playerOnFloor())
            {
                newState = States.JUMP;
            }
        }
        if(cursors.down.isDown)
        {
            this.GroundLayer.startMining("down");
            
            if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "down" && this.playerOnFloor())
            {
                newState = States.MINE;
                newDirection = Directions.DOWN;
            }
            else if(this.player.canClimb)
            {
                newState = States.CLIMB;
                newDirection = Directions.DOWN;
            }
        }

        if(!newState)
        {
            if(!this.playerOnFloor())
            {
                newState = States.FALL;
            }
            else
            {
                newState = States.IDLE;
            }
        }
        
        this.PlayerStateManager.changeState(newState, newDirection);
    }
}

export class Run extends PlayerState {
    constructor(player, PlayerStateManager, GroundLayer, ItemLayer) {
        super(player, PlayerStateManager, GroundLayer, ItemLayer);
    }

    enter(direction)
    {
        this.direction = direction;
        if(direction == Directions.LEFT)
        {
            this.player.setAccelerationX(-75);
        }
        else
        {
            this.player.setAccelerationX(75);
        }
        this.player.anims.play("run", true);
    }
    update(cursors, lastKeyPressed)
    {
        let newState;
        let newDirection;
        let velocity = this.getPlayerVelocity();

        this.craft(lastKeyPressed);
        this.dropDynamite(lastKeyPressed);

        if (cursors.left.isDown)
        {
            this.GroundLayer.startMining("left");
            if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "left")
            {
                newState = States.MINE;
                newDirection = Directions.LEFT;
            }
            else if(this.playerOnFloor())
            {
                if(velocity.x < -200)
                {
                    newState = States.RUN;
                    newDirection = Directions.LEFT;
                }
                else
                {
                    newState = States.WALK;
                    newDirection = Directions.LEFT;
                }
            }
        }
        if (cursors.right.isDown)
        {
            this.GroundLayer.startMining("right");
            if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "right")
            {
                newState = States.MINE;
                newDirection = Directions.RIGHT;
            }
            else if(this.playerOnFloor())
            {
                if(velocity.x > 200)
                {
                    newState = States.RUN;
                    newDirection = Directions.RIGHT;
                }
                else
                {
                    newState = States.WALK;
                    newDirection = Directions.RIGHT;
                }
            }
        }

        if(cursors.space.isDown)
        {
            newState = States.ATTACK;
        }

        if(cursors.up.isDown)
        {
            if(this.player.canClimb)
            {
                newState = States.CLIMB;
                newDirection = Directions.UP;
            }
            else if(this.playerOnFloor())
            {
                newState = States.JUMP;
            }
        }
        if(cursors.down.isDown)
        {
            this.GroundLayer.startMining("down");
            
            if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "down" && this.playerOnFloor())
            {
                newState = States.MINE;
                newDirection = Directions.DOWN;
            }
            else if(this.player.canClimb)
            {
                newState = States.CLIMB;
                newDirection = Directions.DOWN;
            }
        }

        if(!newState)
        {
            if(!this.playerOnFloor())
            {
                newState = States.FALL;
            }
            else
            {
                newState = States.IDLE;
            }
        }
        
        this.PlayerStateManager.changeState(newState, newDirection);
    }
}

export class Mine extends PlayerState {
    constructor(player, PlayerStateManager, GroundLayer, ItemLayer) {
        super(player, PlayerStateManager, GroundLayer, ItemLayer);
    }

    enter(direction)
    {
        this.direction = direction;
        if(direction == Directions.LEFT)
        {
            this.moveHorizontally(direction);
        }
        else if(direction == Directions.RIGHT)
        {
            this.moveHorizontally(direction);
        }
        else
        {
            this.player.setVelocityX(0);
            this.player.setAccelerationX(0);
        }
        this.player.anims.play("mine", true);
    }
    update(cursors, lastKeyPressed)
    {
        let newState;
        let newDirection;

        if(this.GroundLayer.currentMiningDirection && this.GroundLayer.miningTile)
        {
            let tile = this.GroundLayer.checkTileCollision(this.GroundLayer.currentMiningDirection, this.player);

            if (!tile || (tile && (tile.x != this.GroundLayer.miningTile.x || tile.y != this.GroundLayer.miningTile.y)))
            {
                this.GroundLayer.stopMining();
            }
        }


        if (cursors.left.isDown)
        {
            console.log(this.GroundLayer.currentMiningDirection);
            if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "left")
            {
                newState = States.MINE;
                newDirection = Directions.LEFT;
            }
            else if(this.playerOnFloor())
            {
                newState = States.WALK;
                newDirection = Directions.LEFT;
            }
        }
        if (cursors.right.isDown)
        {
            if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "right")
            {
                newState = States.MINE;
                newDirection = Directions.RIGHT;
            }
            else if(this.playerOnFloor())
            {
                newState = States.WALK;
                newDirection = Directions.RIGHT;
            }
        }

        if(cursors.space.isDown)
        {
            newState = States.ATTACK;
        }

        if(cursors.up.isDown)
        {
            if(this.player.canClimb)
            {
                newState = States.CLIMB;
                newDirection = Directions.UP;
            }
            else if(this.playerOnFloor())
            {
                newState = States.JUMP;
            }
        }
        if(cursors.down.isDown)
        {
            if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "down" && this.playerOnFloor())
            {
                newState = States.MINE;
                newDirection = Directions.DOWN;
            }
            else if(this.player.canClimb)
            {
                newState = States.CLIMB;
                newDirection = Directions.DOWN;
            }
        }

        if(!newState)
        {
            if(!this.playerOnFloor())
            {
                newState = States.FALL;
            }
            else
            {
                newState = States.IDLE;
            }
        }

        this.PlayerStateManager.changeState(newState, newDirection);
    }
    exit()
    {
        console.log("exito")
        this.GroundLayer.stopMining()
    }
}

export class Jump extends PlayerState {
    constructor(player, PlayerStateManager, GroundLayer, ItemLayer) {
        super(player, PlayerStateManager, GroundLayer, ItemLayer);
    }

    enter(direction)
    {
        this.player.setVelocityY(-250);
        this.finishedAnimation = false;
        this.player.anims.play("jump", true).on('animationcomplete-jump', 
        ()=>{this.finishedAnimation = true}, this);
    }
    update(cursors, lastKeyPressed)
    {
        let newState;
        let newDirection;

        this.craft(lastKeyPressed)
        this.dropDynamite(lastKeyPressed);

        if(this.finishedAnimation)
        {
            if(this.playerOnFloor())
            {
                newState = States.LAND;
            }
            if (cursors.left.isDown)
            {
                this.GroundLayer.startMining("left");
                this.moveHorizontally(Directions.LEFT);
                if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "left")
                {
                    newState = States.MINE;
                    newDirection = Directions.LEFT;
                }
            }
            else if (cursors.right.isDown)
            {
                this.GroundLayer.startMining("right");
                this.moveHorizontally(Directions.RIGHT);
                if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "right")
                {
                    newState = States.MINE;
                    newDirection = Directions.RIGHT;
                }
            }
            else
            {
                //If not left or right
                this.player.setAccelerationX(0);
                this.player.setVelocityX(0);
            }

            if(cursors.space.isDown)
            {
                newState = States.ATTACK;
            }
    
            if(cursors.up.isDown)
            {
                if(this.player.canClimb)
                {
                    newState = States.CLIMB;
                    newDirection = Directions.UP;
                }
            }
            if(cursors.down.isDown)
            {
                if(this.player.canClimb)
                {
                    newState = States.CLIMB;
                    newDirection = Directions.DOWN;
                }
            }

            if(!newState)
            {
                if(!this.playerOnFloor())
                {
                    newState = States.FALL;
                }
            }
            this.PlayerStateManager.changeState(newState, newDirection);
        }
    }
}

export class Fall extends PlayerState {
    constructor(player, PlayerStateManager, GroundLayer, ItemLayer) {
        super(player, PlayerStateManager, GroundLayer, ItemLayer);
    }

    enter(direction)
    {
        this.player.setAccelerationX(0);
        this.player.anims.play("fall", true);
    }
    update(cursors, lastKeyPressed)
    {
        let newState;
        let newDirection;

        this.craft(lastKeyPressed)
        this.dropDynamite(lastKeyPressed);
        if (cursors.left.isDown)
        {
            this.GroundLayer.startMining("left");
            this.moveHorizontally(Directions.LEFT);
            if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "left")
            {
                newState = States.MINE;
                newDirection = Directions.LEFT;
            }
        }
        else if (cursors.right.isDown)
        {
            this.GroundLayer.startMining("right");
            this.moveHorizontally(Directions.RIGHT);
            if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "right")
            {
                newState = States.MINE;
                newDirection = Directions.RIGHT;
            }
        }
        else
        {
            //If not left or right
            this.player.setAccelerationX(0);
            this.player.setVelocityX(0);
        }

        if(cursors.space.isDown)
        {
            newState = States.ATTACK;
        }

        if(cursors.up.isDown)
        {
            if(this.player.canClimb)
            {
                newState = States.CLIMB;
                newDirection = Directions.UP;
            }
        }
        if(cursors.down.isDown)
        {
            if(this.player.canClimb)
            {
                newState = States.CLIMB;
                newDirection = Directions.DOWN;
            }
        }

        if(this.playerOnFloor())
        {
            newState = States.LAND;
        }
        if(!newState)
        {
            if(!this.playerOnFloor())
            {
                newState = States.FALL;
            }
        }
        this.PlayerStateManager.changeState(newState, newDirection);
    }
}

export class Land extends PlayerState {
    constructor(player, PlayerStateManager, GroundLayer, ItemLayer) {
        super(player, PlayerStateManager, GroundLayer, ItemLayer);
    }

    enter(direction)
    {
        this.finishedAnimation = false;
        this.player.anims.play("land", true).on('animationcomplete-land', 
        ()=>{this.finishedAnimation = true}, this);
    }
    update(cursors, lastKeyPressed)
    {
        let newState;
        let newDirection;

        this.craft(lastKeyPressed)
        this.dropDynamite(lastKeyPressed);

        if(this.finishedAnimation)
        {
            if (cursors.left.isDown)
            {
                this.GroundLayer.startMining("left");
                if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "left")
                {
                    newState = States.MINE;
                    newDirection = Directions.LEFT;
                }
                else if(this.playerOnFloor())
                {
                    newState = States.WALK;
                    newDirection = Directions.LEFT;
                }
            }
            if (cursors.right.isDown)
            {
                this.GroundLayer.startMining("right");
                if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "right")
                {
                    newState = States.MINE;
                    newDirection = Directions.RIGHT;
                }
                else if(this.playerOnFloor())
                {
                    newState = States.WALK;
                    newDirection = Directions.RIGHT;
                }
            }

            if(cursors.space.isDown)
            {
                newState = States.ATTACK;
            }

            if(cursors.up.isDown)
            {
                
                if(this.player.canClimb)
                {
                    newState = States.CLIMB;
                    newDirection = Directions.UP;
                }
                else if(this.playerOnFloor())
                {
                    newState = States.JUMP;
                }
            }
            if(cursors.down.isDown)
            {
                this.GroundLayer.startMining("down");
                
                if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "down" && this.playerOnFloor())
                {
                    newState = States.MINE;
                    newDirection = Directions.DOWN;
                }
                else if(this.player.canClimb)
                {
                    newState = States.CLIMB;
                    newDirection = Directions.DOWN;
                }
            }

            if(!newState)
            {
                if(!this.playerOnFloor())
                {
                    newState = States.FALL;
                }
                else
                {
                    newState = States.IDLE;
                }
            }
            this.PlayerStateManager.changeState(newState, newDirection);
        }
    }

}

export class Climb extends PlayerState {
    currentFrame: integer | null
    constructor(player, PlayerStateManager, GroundLayer, ItemLayer) {
        super(player, PlayerStateManager, GroundLayer, ItemLayer);
        this.currentFrame = null;
    }

    enter(direction)
    {
        this.direction = direction;
        this.player.body.setAllowGravity(false);

        if(direction == Directions.UP)
        {
            if(this.currentFrame)
            {
                this.player.anims.play({key:"climbUp", startFrame: this.currentFrame}, true);
            }
            else
            {
                this.player.anims.play("climbUp", true);
            }
            this.player.setVelocityY(-150);
            
        }
        else if(direction == Directions.DOWN)
        {
            if(this.currentFrame)
            {
                this.player.anims.play({key:"climbDown", startFrame: this.currentFrame}, true);
            }
            else
            {
                this.player.anims.play("climbDown", true);
            }
            this.player.setVelocityY(150);
        }
        else
        {
            if(this.player.anims.currentAnim && this.player.anims.currentFrame && ["climbUp", "climbDown"].includes(this.player.anims.currentAnim.key))
            {
                this.currentFrame = this.player.anims.currentFrame.index - 1;
                this.player.anims.pause();
            }
            else
            {
                this.player.anims.play("climbIdle")
            }
            this.player.setVelocityY(0);
        }
    }
    update(cursors, lastKeyPressed)
    {
        let velocity = this.getPlayerVelocity();
        let newState;
        let newDirection;

        this.craft(lastKeyPressed)
        this.dropDynamite(lastKeyPressed);

        if (cursors.left.isDown)
        {
            this.moveHorizontally(Directions.LEFT);
            this.GroundLayer.startMining("left");
            if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "left")
            {
                newState = States.MINE;
                newDirection = Directions.LEFT;
            }
            else if(this.playerOnFloor())
            {
                if(velocity.x < -200)
                {
                    newState = States.RUN;
                    newDirection = Directions.LEFT;
                }
                else
                {
                    newState = States.WALK;
                    newDirection = Directions.LEFT;
                }
            }
        }
        else if (cursors.right.isDown)
        {
            this.moveHorizontally(Directions.RIGHT);
            this.GroundLayer.startMining("right");
            if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "right")
            {
                newState = States.MINE;
                newDirection = Directions.RIGHT;
            }
            else if(this.playerOnFloor())
            {
                if(velocity.x > 200)
                {
                    newState = States.RUN;
                    newDirection = Directions.RIGHT;
                }
                else
                {
                    newState = States.WALK;
                    newDirection = Directions.RIGHT;
                }
            }
        }
        else
        {
            //If not left or right are down
            this.player.setAccelerationX(0);
            this.player.setVelocityX(0);
        }
        
        if(cursors.space.isDown)
        {
            newState = States.ATTACK;
        }

        if(cursors.up.isDown)
        {
            if(this.player.canClimb)
            {
                newState = States.CLIMB;
                newDirection = Directions.UP;
            }
            else if(this.playerOnFloor())
            {
                newState = States.JUMP;
            }
        }
        if(cursors.down.isDown)
        {
            
            if(this.playerOnFloor())
            {
                this.GroundLayer.startMining("down");
                if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "down")
                {
                    console.log("state");
                    newState = States.MINE;
                    newDirection = Directions.DOWN;
                }
            }
            else if(this.player.canClimb)
            {
                newState = States.CLIMB;
                newDirection = Directions.DOWN;
            }
        }
        if(!newState)
        {
            
            if(this.player.canClimb && !this.playerOnFloor())
            {
                newState = States.CLIMB;
                newDirection = Directions.IDLE;
            }
            else if(this.playerOnFloor())
            {
                newState = States.IDLE;
            }
            else
            {
                newState = States.FALL;
            }
        }
        this.PlayerStateManager.changeState(newState, newDirection)
        
    }

    exit(exitState)
    {
        if(exitState != States.CLIMB)
        {
            this.player.body.setAllowGravity(true);
        }
    }
}

export class Attack extends PlayerState {
    constructor(player, PlayerStateManager, GroundLayer, ItemLayer) {
        super(player, PlayerStateManager, GroundLayer, ItemLayer);
    }

    enter(direction)
    {
        this.finishedAnimation = false;
        this.player.anims.play("attack", true).on('animationcomplete-attack', 
        ()=>{this.finishedAnimation = true}, this);
    }
    update(cursors, lastKeyPressed)
    {
        let newState;
        let newDirection;
        let velocity = this.getPlayerVelocity();

        if(this.finishedAnimation)
        {
            if (cursors.left.isDown)
            {
                this.GroundLayer.startMining("left");
                this.moveHorizontally(Directions.LEFT);
                if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "left")
                {
                    newState = States.MINE;
                    newDirection = Directions.LEFT;
                }
                else if(this.playerOnFloor())
                {
                    if(velocity.x < -200)
                    {
                        newState = States.RUN;
                        newDirection = Directions.LEFT;
                    }
                    else
                    {
                        newState = States.WALK;
                        newDirection = Directions.LEFT;
                    }
                }
            }
            else if (cursors.right.isDown)
            {
                this.GroundLayer.startMining("right");
                this.moveHorizontally(Directions.RIGHT);
                if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "right")
                {
                    newState = States.MINE;
                    newDirection = Directions.RIGHT;
                }
                else if(this.playerOnFloor())
                {
                    if(velocity.x > 200)
                    {
                        newState = States.RUN;
                        newDirection = Directions.RIGHT;
                    }
                    else
                    {
                        newState = States.WALK;
                        newDirection = Directions.RIGHT;
                    }
                }
            }
            else
            {
                this.player.setAccelerationX(0);
                this.player.setVelocityX(0);
            }
    
            if(cursors.space.isDown)
            {
                newState = States.ATTACK;
            }
    
            if(cursors.up.isDown)
            {
                
                if(this.player.canClimb)
                {
                    newState = States.CLIMB;
                    newDirection = Directions.UP;
                }
                else if(this.playerOnFloor())
                {
                    newState = States.JUMP;
                }
            }
            if(cursors.down.isDown)
            {
                this.GroundLayer.startMining("down");
                
                if(this.GroundLayer.miningCooldown && this.GroundLayer.currentMiningDirection == "down" && this.playerOnFloor())
                {
                    newState = States.MINE;
                    newDirection = Directions.DOWN;
                }
                else if(this.player.canClimb)
                {
                    newState = States.CLIMB;
                    newDirection = Directions.DOWN;
                }
            }
    
            if(!newState)
            {
                if(!this.playerOnFloor())
                {
                    newState = States.FALL;
                }
                else
                {
                    newState = States.IDLE;
                }
            }
            this.PlayerStateManager.changeState(newState, newDirection);
        }
        
    }
}