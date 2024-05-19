namespace SpriteKind {
    export const Tower = SpriteKind.create()
}
function initialize_variables () {
    wave = 0
    starting_wave = false
    in_wave = false
    menu_open = false
    tower_counter = 0
    fps = 0
    fps_count = 0
    average_fps = 0
}
sprites.onCreated(SpriteKind.Enemy, function (sprite) {
    sprite.setFlag(SpriteFlag.GhostThroughSprites, false)
    sprite.setFlag(SpriteFlag.GhostThroughTiles, true)
    sprite.setFlag(SpriteFlag.GhostThroughWalls, true)
})
function update_sniper_monkey (sprite: Sprite) {
    timer.throttle(convertToText(sprites.readDataNumber(sprite, "tower_id")), sprites.readDataNumber(sprite, "fire_dart_delay"), function () {
        for (let index = 0; index < sprites.readDataNumber(sprite, "darts_shot"); index++) {
            farthest_sprite = get_farthest_among_path_sprite_of_kind(sprite, SpriteKind.Enemy, sprites.readDataNumber(sprite, "tower_distance"))
            if (can_find_farthest_among_path_sprite_of_kind(sprite, SpriteKind.Enemy, sprites.readDataNumber(sprite, "tower_distance"))) {
                projectile = summon_dart(sprites.readDataNumber(sprite, "dart_image_index"), sprite)
                sprites.setDataNumber(projectile, "angle", spriteutils.radiansToDegrees(spriteutils.angleFrom(projectile, farthest_sprite)) - 90)
                projectile.setFlag(SpriteFlag.Invisible, !(debug) && true)
                if (debug && false) {
                    projectile.say(sprites.readDataNumber(projectile, "angle"))
                }
                sprites.setDataNumber(projectile, "dart_health", sprites.readDataNumber(sprite, "dart_health"))
                flip_tower(sprite, sprites.readDataNumber(projectile, "angle"))
                if (sprites.readDataBoolean(sprite, "dart_follow")) {
                    projectile.follow(farthest_sprite, sprites.readDataNumber(sprite, "dart_speed"))
                } else {
                    spriteutils.setVelocityAtAngle(projectile, spriteutils.angleFrom(projectile, farthest_sprite), sprites.readDataNumber(sprite, "dart_speed"))
                }
            }
        }
    })
}
function update_dart_monkey (sprite: Sprite) {
    timer.throttle(convertToText(sprites.readDataNumber(sprite, "tower_id")), sprites.readDataNumber(sprite, "fire_dart_delay"), function () {
        farthest_sprite = get_farthest_among_path_sprite_of_kind(sprite, SpriteKind.Enemy, sprites.readDataNumber(sprite, "tower_distance"))
        if (can_find_farthest_among_path_sprite_of_kind(sprite, SpriteKind.Enemy, sprites.readDataNumber(sprite, "tower_distance"))) {
            projectile = summon_dart(sprites.readDataNumber(sprite, "dart_image_index"), sprite)
            sprites.setDataNumber(projectile, "angle", spriteutils.radiansToDegrees(spriteutils.angleFrom(projectile, farthest_sprite)) - 90)
            if (average_fps > 15) {
                transformSprites.rotateSprite(projectile, sprites.readDataNumber(projectile, "angle"))
            }
            if (debug && false) {
                projectile.say(sprites.readDataNumber(projectile, "angle"))
            }
            sprites.setDataNumber(projectile, "dart_health", sprites.readDataNumber(sprite, "dart_health"))
            flip_tower(sprite, sprites.readDataNumber(projectile, "angle"))
            if (sprites.readDataBoolean(sprite, "dart_follow")) {
                projectile.follow(farthest_sprite, sprites.readDataNumber(sprite, "dart_speed"))
            } else {
                spriteutils.setVelocityAtAngle(projectile, spriteutils.angleFrom(projectile, farthest_sprite), sprites.readDataNumber(sprite, "dart_speed"))
            }
        }
    })
}
function on_valid_land_spot (sprite: Sprite) {
    for (let tile of land_tiles) {
        if (sprite.tileKindAt(TileDirection.Center, tile)) {
            return true
        }
    }
    return false
}
function sniper_monkey_right_click () {
    blockMenu.setColors(1, 15)
    tower_options = ["Cancel", "Sell for $" + sprites.readDataNumber(overlapping_sprite, "sell_price")]
    if (sprites.readDataNumber(overlapping_sprite, "fire_dart_delay") > sprites.readDataNumber(overlapping_sprite, "fire_dart_delay_min")) {
        tower_options.push("Decrease firing delay ($50) to " + (sprites.readDataNumber(overlapping_sprite, "fire_dart_delay") - 250) + " ms")
    }
    if (sprites.readDataNumber(overlapping_sprite, "dart_health") < sprites.readDataNumber(overlapping_sprite, "dart_health_max")) {
        tower_options.push("Increase bullet durability ($30) to " + (sprites.readDataNumber(overlapping_sprite, "dart_health") + 1) + " px")
    }
    if (sprites.readDataNumber(overlapping_sprite, "darts_shot") < sprites.readDataNumber(overlapping_sprite, "darts_shot_max")) {
        tower_options.push("Increase bullets shot ($60) to " + (sprites.readDataNumber(overlapping_sprite, "darts_shot") + 1) + " bullets")
    }
    blockMenu.showMenu(tower_options, MenuStyle.List, MenuLocation.BottomHalf)
    wait_for_menu_select()
    if (blockMenu.selectedMenuIndex() == 0) {
    	
    } else if (blockMenu.selectedMenuIndex() == 1) {
        info.changeScoreBy(sprites.readDataNumber(overlapping_sprite, "sell_price"))
        overlapping_sprite.destroy()
    } else if (blockMenu.selectedMenuOption().includes("Decrease firing delay") && info.score() >= 50) {
        sprites.changeDataNumberBy(overlapping_sprite, "fire_dart_delay", -250)
        sprites.changeDataNumberBy(overlapping_sprite, "sell_price", 30)
        overlapping_sprite.startEffect(effects.halo, 1000)
        change_score(-50)
    } else if (blockMenu.selectedMenuOption().includes("Increase bullet durability") && info.score() >= 30) {
        sprites.changeDataNumberBy(overlapping_sprite, "dart_health", 1)
        sprites.changeDataNumberBy(overlapping_sprite, "sell_price", 20)
        overlapping_sprite.startEffect(effects.halo, 1000)
        change_score(-30)
    } else if (blockMenu.selectedMenuOption().includes("Increase bullets shot") && info.score() >= 60) {
        sprites.changeDataNumberBy(overlapping_sprite, "darts_shot", 1)
        sprites.changeDataNumberBy(overlapping_sprite, "sell_price", 45)
        overlapping_sprite.startEffect(effects.halo, 1000)
        change_score(-60)
    } else {
        sprite_cursor_pointer.say("Not enough money!", 1000)
    }
}
scene.onPathCompletion(SpriteKind.Enemy, function (sprite, location) {
    sprite.destroy()
    scene.cameraShake(2, 100)
    if (!(debug) || false) {
        info.changeLifeBy(sprites.readDataNumber(sprite, "health") * 2 * -1)
    }
})
function overlapping_sprite_of_kind (sprite: Sprite, kind: number) {
    for (let sprite2 of sprites.allOfKind(kind)) {
        if (sprite.overlapsWith(sprite2)) {
            return true
        }
    }
    return false
}
controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    if (controller.A.isPressed()) {
        if (!(in_wave)) {
            starting_wave = false
            info.startCountdown(5)
        }
    } else {
        if (!(menu_open) && game_started) {
            timer.background(function () {
                if (overlapping_sprite_of_kind(sprite_cursor_pointer, SpriteKind.Tower)) {
                    overlapping_sprite = overlapped_sprite_of_kind(sprite_cursor_pointer, SpriteKind.Tower)
                    if (sprites.readDataString(overlapping_sprite, "name") == "dart_monkey") {
                        dart_monkey_right_click()
                    } else if (sprites.readDataString(overlapping_sprite, "name") == "tack_shooter") {
                        tack_shooter_right_click()
                    } else if (sprites.readDataString(overlapping_sprite, "name") == "sniper_monkey") {
                        sniper_monkey_right_click()
                    } else if (sprites.readDataString(overlapping_sprite, "name") == "monkey_buccaneer") {
                        monkey_buccaneer_right_click()
                    }
                } else {
                    blockMenu.setColors(1, 15)
                    // https://bloons.fandom.com/wiki/Tower_price_lists#Bloons_TD_5:~:text=%24.-,Bloons%20TD%205
                    blockMenu.showMenu(["Cancel", "Dart Monkey ($30)", "Tack Shooter ($50)", "Sniper Monkey ($40)", "Monkey Buccaneer ($60)"], MenuStyle.List, MenuLocation.BottomHalf)
                    wait_for_menu_select()
                    if (blockMenu.selectedMenuIndex() == 0) {
                    	
                    } else if (blockMenu.selectedMenuIndex() == 1 && ((info.score() >= 30 || debug) && (on_valid_land_spot(sprite_cursor_pointer) && !(overlapping_sprite_of_kind(sprite_cursor_pointer, SpriteKind.Tower))))) {
                        summon_dart_monkey()
                    } else if (blockMenu.selectedMenuIndex() == 2 && ((info.score() >= 50 || debug) && (on_valid_land_spot(sprite_cursor_pointer) && !(overlapping_sprite_of_kind(sprite_cursor_pointer, SpriteKind.Tower))))) {
                        summon_tack_shooter()
                    } else if (blockMenu.selectedMenuIndex() == 3 && ((info.score() >= 40 || debug) && (on_valid_land_spot(sprite_cursor_pointer) && !(overlapping_sprite_of_kind(sprite_cursor_pointer, SpriteKind.Tower))))) {
                        summon_sniper_monkey()
                    } else if (blockMenu.selectedMenuIndex() == 4 && ((info.score() >= 60 || debug) && (on_valid_water_spot(sprite_cursor_pointer) && !(overlapping_sprite_of_kind(sprite_cursor_pointer, SpriteKind.Tower))))) {
                        summon_monkey_buccaneer()
                    } else {
                        game.showLongText("Not on a valid spot or not enough money!", DialogLayout.Bottom)
                    }
                }
            })
        }
    }
})
function tack_shooter_right_click () {
    blockMenu.setColors(1, 15)
    tower_options = ["Cancel", "Sell for $" + sprites.readDataNumber(overlapping_sprite, "sell_price")]
    if (sprites.readDataNumber(overlapping_sprite, "fire_dart_delay") > sprites.readDataNumber(overlapping_sprite, "fire_dart_delay_min")) {
        tower_options.push("Decrease firing delay ($50) to " + (sprites.readDataNumber(overlapping_sprite, "fire_dart_delay") - 200) + " ms")
    }
    if (sprites.readDataNumber(overlapping_sprite, "dart_count") < sprites.readDataNumber(overlapping_sprite, "dart_count_max")) {
        tower_options.push("Increase tacks shot ($70) to " + (sprites.readDataNumber(overlapping_sprite, "dart_count") + 2) + " tacks")
    }
    if (sprites.readDataNumber(overlapping_sprite, "dart_health") < sprites.readDataNumber(overlapping_sprite, "dart_health_max")) {
        tower_options.push("Increase dart durability ($40) to " + (sprites.readDataNumber(overlapping_sprite, "dart_health") + 1) + " Bloons")
    }
    blockMenu.showMenu(tower_options, MenuStyle.List, MenuLocation.BottomHalf)
    wait_for_menu_select()
    if (blockMenu.selectedMenuIndex() == 0) {
    	
    } else if (blockMenu.selectedMenuIndex() == 1) {
        info.changeScoreBy(sprites.readDataNumber(overlapping_sprite, "sell_price"))
        overlapping_sprite.destroy()
    } else if (blockMenu.selectedMenuOption().includes("Decrease firing delay") && info.score() >= 50) {
        sprites.changeDataNumberBy(overlapping_sprite, "fire_dart_delay", -100)
        sprites.changeDataNumberBy(overlapping_sprite, "sell_price", 30)
        overlapping_sprite.startEffect(effects.halo, 1000)
        change_score(-50)
    } else if (blockMenu.selectedMenuOption().includes("Increase tacks shot") && info.score() >= 70) {
        sprites.changeDataNumberBy(overlapping_sprite, "dart_count", 2)
        sprites.changeDataNumberBy(overlapping_sprite, "sell_price", 45)
        overlapping_sprite.startEffect(effects.halo, 1000)
        change_score(-70)
    } else if (blockMenu.selectedMenuOption().includes("Increase dart durability") && info.score() >= 40) {
        sprites.changeDataNumberBy(overlapping_sprite, "dart_health", 1)
        sprites.changeDataNumberBy(overlapping_sprite, "sell_price", 30)
        overlapping_sprite.startEffect(effects.halo, 1000)
        change_score(-40)
    } else {
        sprite_cursor_pointer.say("Not enough money!", 1000)
    }
}
sprites.onDestroyed(SpriteKind.Tower, function (sprite) {
    sprite_shadow = sprites.readDataSprite(sprite, "shadow_sprite")
    if (sprite_shadow) {
        sprite_shadow.destroy()
    }
})
spriteutils.createRenderable(200, function (screen2) {
    if (!(game_started)) {
        screen2.fillRect(0, scene.screenHeight() / 2 - 45, scene.screenWidth(), 25, 15)
        images.printCenter(screen2, "Bloons Tower Defense v2", scene.screenHeight() / 2 - 41, 1)
        images.printCenter(screen2, "By Unsigned_Arduino", scene.screenHeight() / 2 - 31, 1)
    }
})
function summon_sniper_monkey () {
    sprite_tower = sprites.create(img`
        ......................
        ......................
        ......ffffffff........
        ....ffee77e777ff......
        ..ff7ee77eee7eeef.....
        .fee7777ee777eee7f....
        ..ffcdfddfdeeffff.....
        ....cdfddfdeeddf......
        ...cdeeddddfffdc......
        ...cddddcdfccfdc......
        ...cccccdfcccfcfffff..
        ....fddffffffffcccccf.
        ..fffffccccccccccccccf
        .fccccccccccccccccccf.
        .fcccfffffcccccfffff..
        .fcccfdbfeffffff.ef...
        ..ffffddfeeeeeeffef...
        ....ffffffeeeeeffff...
        .....fffffffffffff....
        `, SpriteKind.Tower)
    sprite_tower.setPosition(sprite_cursor_pointer.x, sprite_cursor_pointer.y)
    sprites.setDataNumber(sprite_tower, "fire_dart_delay", 2000)
    sprites.setDataNumber(sprite_tower, "fire_dart_delay_min", 250)
    sprites.setDataNumber(sprite_tower, "tower_id", tower_counter)
    sprites.setDataNumber(sprite_tower, "tower_distance", 0)
    sprites.setDataString(sprite_tower, "name", "sniper_monkey")
    sprites.setDataNumber(sprite_tower, "sell_price", 30)
    sprites.setDataNumber(sprite_tower, "dart_speed", 500)
    sprites.setDataNumber(sprite_tower, "dart_health", 2)
    sprites.setDataNumber(sprite_tower, "dart_health_max", 6)
    sprites.setDataNumber(sprite_tower, "darts_shot", 1)
    sprites.setDataNumber(sprite_tower, "darts_shot_max", 3)
    sprites.setDataBoolean(sprite_tower, "dart_follow", false)
    sprites.setDataBoolean(sprite_tower, "facing_left", true)
    sprites.setDataNumber(sprite_tower, "dart_image_index", 2)
    if (user_monkey_shadows) {
        create_shadow(sprite_tower, img`
            . . . f f f f f f f f f f f f . . . 
            . f f f f f f f f f f f f f f f f . 
            f f f f f f f f f f f f f f f f f f 
            f f f f f f f f f f f f f f f f f f 
            f f f f f f f f f f f f f f f f f f 
            . f f f f f f f f f f f f f f f f . 
            . . . f f f f f f f f f f f f . . . 
            `)
    }
    tower_counter += 1
    change_score(-30)
}
function summon_monkey_buccaneer () {
    sprite_tower = sprites.create(img`
        ...........fffff.........
        ..........ff111ff........
        ......ff.fff111fff.ff....
        ......fffffff1fffffff....
        .......fffffffffffff.....
        ........cdfddfdeeff......
        ........cdfddfdeeddf.....
        .......cdeeddddeebdc.....
        .......cddddcddeebdc.ff..
        .......cccccdddeefc.fef..
        ........fdddddeeff..fef..
        .........fffffeeeef.fef..
        .ffff......feeeeeeeffef..
        fccccfff..feffefeeeeff...
        fcccccccffffffefeeeef....
        .fffcccccccfefffffffffff.
        ....fffccccfccceeeeeeecef
        .......ffffcceccccccccef.
        .......fecceeeeeeeeeeef..
        ........ffffffffffffff...
        `, SpriteKind.Tower)
    sprite_tower.setPosition(sprite_cursor_pointer.x, sprite_cursor_pointer.y)
    sprites.setDataNumber(sprite_tower, "fire_dart_delay", 1000)
    sprites.setDataNumber(sprite_tower, "fire_dart_delay_min", 200)
    sprites.setDataNumber(sprite_tower, "tower_id", tower_counter)
    sprites.setDataNumber(sprite_tower, "tower_distance", 64)
    sprites.setDataNumber(sprite_tower, "tower_max_distance", 128)
    sprites.setDataString(sprite_tower, "name", "monkey_buccaneer")
    sprites.setDataNumber(sprite_tower, "sell_price", 40)
    sprites.setDataNumber(sprite_tower, "dart_speed", 150)
    sprites.setDataNumber(sprite_tower, "dart_health", 2)
    sprites.setDataNumber(sprite_tower, "dart_health_max", 4)
    sprites.setDataNumber(sprite_tower, "darts_shot", 1)
    sprites.setDataNumber(sprite_tower, "darts_shot_max", 1)
    sprites.setDataBoolean(sprite_tower, "dart_follow", false)
    sprites.setDataBoolean(sprite_tower, "facing_left", true)
    sprites.setDataNumber(sprite_tower, "dart_image_index", 0)
    if (user_monkey_shadows) {
        create_shadow(sprite_tower, img`
            . . . f f f f f f f f f f f f f f . . . 
            . f f f f f f f f f f f f f f f f f f . 
            f f f f f f f f f f f f f f f f f f f f 
            f f f f f f f f f f f f f f f f f f f f 
            f f f f f f f f f f f f f f f f f f f f 
            . f f f f f f f f f f f f f f f f f f . 
            . . . f f f f f f f f f f f f f f . . . 
            `)
    }
    tower_counter += 1
    change_score(-60)
}
function overlapped_sprite_of_kind (sprite: Sprite, kind: number) {
    for (let sprite2 of sprites.allOfKind(kind)) {
        if (sprite.overlapsWith(sprite2)) {
            return sprite2
        }
    }
    return sprite
}
function summon_dart (image_index: number, sprite: Sprite) {
    if (fps < 15) {
        projectile = sprites.createProjectileFromSprite(img`
            f f 
            f f 
            `, sprite, 0, 0)
    } else if (average_fps > 15) {
        projectile = sprites.createProjectileFromSprite(dart_image_from_index(image_index).clone(), sprite, 0, 0)
    }
    projectile.setFlag(SpriteFlag.AutoDestroy, false)
    projectile.setFlag(SpriteFlag.DestroyOnWall, true)
    return projectile
}
function on_valid_water_spot (sprite: Sprite) {
    for (let tile of water_tiles) {
        if (sprite.tileKindAt(TileDirection.Center, tile)) {
            return true
        }
    }
    return false
}
function fade_out (time: number, block: boolean) {
    color.startFade(color.Black, color.originalPalette, time)
    if (block) {
        color.pauseUntilFadeDone()
    }
}
info.onCountdownEnd(function () {
    if (!(starting_wave)) {
        wave += 1
        starting_wave = true
        in_wave = true
        timer.background(function () {
            Notification.notify("Wave " + wave + " begin!")
        })
        timer.background(function () {
            if (wave / 3 == Math.idiv(wave, 3)) {
                info.startCountdown(wave * 10 * (50 / 1000))
            } else {
                info.startCountdown(wave * 10 * (Math.max(1000 - wave * 100, 100) / 1000))
            }
            for (let index = 0; index <= wave * 10 - 1; index++) {
                bloon_path = randint(0, bloon_paths.length - 1)
                console.log(Math.min(Math.idiv(index, 30) + 1, bloon_images.length - 1))
                summon_bloon(start_x, start_y, Math.idiv(index, 30) + 1, Math.max(wave * 5 * (Math.idiv(index, 20) + 1), 20), bloon_path)
                console.log(wave / 3 == Math.idiv(wave, 3))
                if (wave / 3 == Math.idiv(wave, 3)) {
                    pause(50)
                } else {
                    pause(Math.max(1000 - wave * 100, 50))
                }
            }
            timer.background(function () {
                for (let index = 0; index < wave * 5 / 2; index++) {
                    info.changeScoreBy(2)
                    pause(50)
                }
            })
            timer.background(function () {
                Notification.notify("Wave " + wave + " end!")
                in_wave = false
            })
        })
    } else {
        starting_wave = false
    }
})
function fade_in (time: number, block: boolean) {
    color.startFade(color.originalPalette, color.Black, time)
    if (block) {
        color.pauseUntilFadeDone()
    }
}
function wait_for_menu_select () {
    menu_option_selected = false
    menu_open = true
    controller.moveSprite(sprite_cursor, 0, 0)
    while (!(menu_option_selected)) {
        pause(100)
    }
    controller.moveSprite(sprite_cursor, 75, 75)
    menu_open = false
    blockMenu.closeMenu()
}
function set_map_bloons_forest () {
    bloon_paths = []
    start_x = 0
    start_y = 5
    land_tiles = [assets.tile`tile_dark_water`, sprites.castle.tileDarkGrass2, sprites.castle.tileDarkGrass1, sprites.castle.tileDarkGrass3]
    water_tiles = []
    for (let tilemap2 of [tiles.createMap(tilemap`level20`), tiles.createMap(tilemap`level21`)]) {
        tiles.loadMap(tilemap2)
        bloon_paths.push(scene.aStar(tiles.getTilesByType(assets.tile`tile_bloon_start`)[0], tiles.getTilesByType(assets.tile`tile_bloon_end`)[0]))
    }
    tiles.setTilemap(tilemap`level8`)
    scene.setBackgroundColor(6)
}
function set_map_sand_castle () {
    bloon_paths = []
    start_x = 0
    start_y = 1
    land_tiles = [sprites.castle.tilePath5, assets.tile`tile_left_water_edge_sand`, assets.tile`tile_right_water_edge_sand`]
    water_tiles = [assets.tile`tile_water`]
    for (let tilemap2 of [tiles.createMap(tilemap`level17`)]) {
        tiles.loadMap(tilemap2)
        bloon_paths.push(scene.aStar(tiles.getTilesByType(assets.tile`tile_bloon_start`)[0], tiles.getTilesByType(assets.tile`tile_bloon_end`)[0]))
    }
    tiles.setTilemap(tilemap`level6`)
    scene.setBackgroundColor(13)
}
function create_cursor () {
    sprite_cursor = sprites.create(img`
        2 . . . . . . . . . 
        f f . . . . . . . . 
        f 1 f . . . . . . . 
        f 1 1 f . . . . . . 
        f 1 1 1 f . . . . . 
        f 1 1 1 1 f . . . . 
        f 1 1 1 1 1 f . . . 
        f 1 1 1 1 1 1 f . . 
        f 1 1 1 1 1 1 1 f . 
        f 1 1 f 1 f f f f f 
        f 1 f f 1 f . . . . 
        f f . . f 1 f . . . 
        f . . . f 1 f . . . 
        . . . . . f 1 f . . 
        . . . . . f 1 f . . 
        . . . . . . f . . . 
        `, SpriteKind.Player)
    controller.moveSprite(sprite_cursor, 75, 75)
    sprite_cursor_pointer = sprites.create(img`
        f 
        `, SpriteKind.Player)
    sprite_cursor.z = 149
    sprite_cursor_pointer.z = 150
    scene.cameraFollowSprite(sprite_cursor)
}
function summon_dart_monkey () {
    sprite_tower = sprites.create(img`
        . . . . f f f f f . . . . . . . 
        . . . f e e e e e f . . . . . . 
        . . f d d d d e e e f . . . . . 
        . c d f d d f d e e f f . . . . 
        . c d f d d f d e e d d f . . . 
        c d e e d d d d e e b d c . . . 
        c d d d d c d d e e b d c . f f 
        c c c c c d d d e e f c . f e f 
        . f d d d d d e e f f . . f e f 
        . . f f f f f e e e e f . f e f 
        . . . . f e e e e e e e f f e f 
        . . . f e f f e f e e e e f f . 
        . . . f e f f e f e e e e f . . 
        . . . f d b f d b f f e f . . . 
        . . . f d d c d d b b d f . . . 
        . . . . f f f f f f f f f . . . 
        `, SpriteKind.Tower)
    sprite_tower.setPosition(sprite_cursor_pointer.x, sprite_cursor_pointer.y)
    sprites.setDataNumber(sprite_tower, "fire_dart_delay", 1000)
    sprites.setDataNumber(sprite_tower, "fire_dart_delay_min", 200)
    sprites.setDataNumber(sprite_tower, "tower_id", tower_counter)
    sprites.setDataNumber(sprite_tower, "tower_distance", 48)
    sprites.setDataNumber(sprite_tower, "tower_max_distance", 96)
    sprites.setDataString(sprite_tower, "name", "dart_monkey")
    sprites.setDataNumber(sprite_tower, "sell_price", 20)
    sprites.setDataNumber(sprite_tower, "dart_speed", 150)
    sprites.setDataNumber(sprite_tower, "dart_health", 1)
    sprites.setDataNumber(sprite_tower, "dart_health_max", 5)
    sprites.setDataBoolean(sprite_tower, "dart_follow", false)
    sprites.setDataBoolean(sprite_tower, "facing_left", true)
    sprites.setDataNumber(sprite_tower, "dart_image_index", 0)
    if (user_monkey_shadows) {
        create_shadow(sprite_tower, img`
            . . . f f f f f f f f . . . 
            . f f f f f f f f f f f f . 
            f f f f f f f f f f f f f f 
            f f f f f f f f f f f f f f 
            f f f f f f f f f f f f f f 
            . f f f f f f f f f f f f . 
            . . . f f f f f f f f . . . 
            `)
    }
    tower_counter += 1
    change_score(-30)
}
function get_strongest_among_path_sprite_of_kind (sprite: Sprite, kind: number, max_distance: number) {
    strength = 0
    for (let sprite2 of sprites.allOfKind(kind)) {
        if (sprites.readDataNumber(sprite2, "health") >= strength) {
            if (spriteutils.distanceBetween(sprite, sprite2) <= max_distance || max_distance == 0) {
                sprite_farthest_among_path = sprite2
                strength = sprites.readDataNumber(sprite2, "health")
            }
        }
    }
    return sprite_farthest_among_path
}
function flip_tower (sprite: Sprite, angle: number) {
    if (angle < -180 || angle > 0) {
        if (!(sprites.readDataBoolean(sprite, "facing_left"))) {
            sprites.setDataBoolean(sprite, "facing_left", true)
            sprite.image.flipX()
        }
    } else {
        if (sprites.readDataBoolean(sprite, "facing_left")) {
            sprites.setDataBoolean(sprite, "facing_left", false)
            sprite.image.flipX()
        }
    }
}
function set_map_figure_eights () {
    bloon_paths = []
    start_x = 0
    start_y = 1
    land_tiles = [assets.tile`tile_grass`, sprites.castle.tileGrass1, sprites.castle.tileGrass3, sprites.castle.tileGrass2]
    water_tiles = [
    assets.tile`tile_water`,
    assets.tile`tile_left_grass_edge_water`,
    assets.tile`tile_top_left_grass_edge_water`,
    assets.tile`tile_top_right_grass_edge_water`,
    assets.tile`tile_right_grass_edge_water`,
    assets.tile`tile_bottom_right_grass_edge_water`,
    assets.tile`tile_bottom_grass_edge_water`,
    assets.tile`tile_bottom_left_grass_edge_water`
    ]
    for (let tilemap2 of [tiles.createMap(tilemap`level9`), tiles.createMap(tilemap`level10`)]) {
        tiles.loadMap(tilemap2)
        bloon_paths.push(scene.aStar(tiles.getTilesByType(assets.tile`tile_bloon_start`)[0], tiles.getTilesByType(assets.tile`tile_bloon_end`)[0]))
    }
    tiles.setTilemap(tilemap`level1`)
    scene.setBackgroundColor(7)
}
function set_map_field_of_flowers () {
    bloon_paths = []
    start_x = 13
    start_y = 0
    land_tiles = [assets.tile`tile_grass`, sprites.castle.tileGrass1, sprites.castle.tileGrass3, sprites.castle.tileGrass2]
    water_tiles = []
    for (let tilemap2 of [tiles.createMap(tilemap`level11`)]) {
        tiles.loadMap(tilemap2)
        bloon_paths.push(scene.aStar(tiles.getTilesByType(assets.tile`tile_bloon_start`)[0], tiles.getTilesByType(assets.tile`tile_bloon_end`)[0]))
    }
    tiles.setTilemap(tilemap`level2`)
    scene.setBackgroundColor(7)
}
function can_find_strongest_among_path_sprite_of_kind (sprite: Sprite, kind: number, max_distance: number) {
    for (let sprite2 of sprites.allOfKind(kind)) {
        if (spriteutils.distanceBetween(sprite, sprite2) <= max_distance || max_distance == 0) {
            return true
        }
    }
    return false
}
function dart_image_from_index (index: number) {
    dart_images = [img`
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . 5 5 5 5 5 . . . . . . 
        . . . . . . 5 5 5 . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . f f f . . . . . . . 
        . . . . . . f f f . . . . . . . 
        . . . . . . f f f . . . . . . . 
        . . . . . . f f f . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        `, img`
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . c c c . . . . . . . 
        . . . . . . . c . . . . . . . . 
        . . . . . . . c . . . . . . . . 
        . . . . . . . c . . . . . . . . 
        . . . . . . . c . . . . . . . . 
        . . . . . . . c . . . . . . . . 
        . . . . . . . c . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        `, img`
        f f 
        f f 
        `]
    return dart_images[Math.constrain(index, 0, dart_images.length - 1)]
}
function update_monkey_buccaneer (sprite: Sprite) {
    timer.throttle(convertToText(sprites.readDataNumber(sprite, "tower_id")), sprites.readDataNumber(sprite, "fire_dart_delay"), function () {
        farthest_sprite = get_farthest_among_path_sprite_of_kind(sprite, SpriteKind.Enemy, sprites.readDataNumber(sprite, "tower_distance"))
        if (can_find_farthest_among_path_sprite_of_kind(sprite, SpriteKind.Enemy, sprites.readDataNumber(sprite, "tower_distance"))) {
            for (let index = 0; index <= 1; index++) {
                projectile = summon_dart(sprites.readDataNumber(sprite, "dart_image_index"), sprite)
                if (index == 0) {
                    sprites.setDataNumber(projectile, "angle", spriteutils.radiansToDegrees(spriteutils.angleFrom(projectile, farthest_sprite)) - 90)
                } else {
                    sprites.setDataNumber(projectile, "angle", spriteutils.radiansToDegrees(spriteutils.angleFrom(projectile, farthest_sprite)) - 90 - 180)
                }
                if (average_fps > 15) {
                    transformSprites.rotateSprite(projectile, sprites.readDataNumber(projectile, "angle"))
                }
                if (debug && false) {
                    projectile.say(sprites.readDataNumber(projectile, "angle"))
                }
                sprites.setDataNumber(projectile, "dart_health", sprites.readDataNumber(sprite, "dart_health"))
                if (index == 0) {
                    flip_tower(sprite, sprites.readDataNumber(projectile, "angle"))
                }
                if (index == 0) {
                    spriteutils.setVelocityAtAngle(projectile, spriteutils.angleFrom(projectile, farthest_sprite), sprites.readDataNumber(sprite, "dart_speed"))
                } else {
                    spriteutils.setVelocityAtAngle(projectile, spriteutils.angleFrom(projectile, farthest_sprite) + 3.141592653589796, sprites.readDataNumber(sprite, "dart_speed"))
                }
            }
        }
    })
}
function set_map_dark_dungeon () {
    bloon_paths = []
    start_x = 5
    start_y = 0
    land_tiles = [
    sprites.dungeon.darkGroundCenter,
    sprites.dungeon.darkGroundNorthWest1,
    sprites.dungeon.darkGroundEast,
    sprites.dungeon.darkGroundSouthWest1,
    sprites.dungeon.darkGroundSouth,
    sprites.dungeon.darkGroundNorth,
    sprites.dungeon.darkGroundNorthEast1,
    sprites.dungeon.darkGroundWest,
    sprites.dungeon.darkGroundSouthEast1
    ]
    water_tiles = [sprites.dungeon.hazardLava0, sprites.dungeon.hazardLava1]
    for (let tilemap2 of [tiles.createMap(tilemap`level16`)]) {
        tiles.loadMap(tilemap2)
        bloon_paths.push(scene.aStar(tiles.getTilesByType(assets.tile`tile_bloon_start`)[0], tiles.getTilesByType(assets.tile`tile_bloon_end`)[0]))
    }
    tiles.setTilemap(tilemap`level5`)
    scene.setBackgroundColor(13)
}
function bloon_image_from_health (health: number) {
    // https://bloons.fandom.com/wiki/Bloon#BTD_series_
    bloon_images = [
    img`
        . . . . . . 2 2 2 2 . . . . . . 
        . . . . . 2 2 2 2 2 2 . . . . . 
        . . . . 2 2 2 2 2 2 2 2 . . . . 
        . . . . 2 2 2 2 2 2 2 2 . . . . 
        . . . . 2 2 2 2 2 2 2 2 . . . . 
        . . . . 2 2 2 2 2 2 2 2 . . . . 
        . . . . . 2 2 2 2 2 2 . . . . . 
        . . . . . 2 2 2 2 2 2 . . . . . 
        . . . . . . 2 2 2 2 . . . . . . 
        . . . . . . . 2 2 . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . . f . . . . . . . 
        . . . . . . . . f . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        `,
    img`
        . . . . . . 9 9 9 9 . . . . . . 
        . . . . . 9 9 9 9 9 9 . . . . . 
        . . . . 9 9 9 9 9 9 9 9 . . . . 
        . . . . 9 9 9 9 9 9 9 9 . . . . 
        . . . . 9 9 9 9 9 9 9 9 . . . . 
        . . . . 9 9 9 9 9 9 9 9 . . . . 
        . . . . . 9 9 9 9 9 9 . . . . . 
        . . . . . 9 9 9 9 9 9 . . . . . 
        . . . . . . 9 9 9 9 . . . . . . 
        . . . . . . . 9 9 . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . . f . . . . . . . 
        . . . . . . . . f . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        `,
    img`
        . . . . . . 7 7 7 7 . . . . . . 
        . . . . . 7 7 7 7 7 7 . . . . . 
        . . . . 7 7 7 7 7 7 7 7 . . . . 
        . . . . 7 7 7 7 7 7 7 7 . . . . 
        . . . . 7 7 7 7 7 7 7 7 . . . . 
        . . . . 7 7 7 7 7 7 7 7 . . . . 
        . . . . . 7 7 7 7 7 7 . . . . . 
        . . . . . 7 7 7 7 7 7 . . . . . 
        . . . . . . 7 7 7 7 . . . . . . 
        . . . . . . . 7 7 . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . . f . . . . . . . 
        . . . . . . . . f . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        `,
    img`
        . . . . . . 5 5 5 5 . . . . . . 
        . . . . . 5 5 5 5 5 5 . . . . . 
        . . . . 5 5 5 5 5 5 5 5 . . . . 
        . . . . 5 5 5 5 5 5 5 5 . . . . 
        . . . . 5 5 5 5 5 5 5 5 . . . . 
        . . . . 5 5 5 5 5 5 5 5 . . . . 
        . . . . . 5 5 5 5 5 5 . . . . . 
        . . . . . 5 5 5 5 5 5 . . . . . 
        . . . . . . 5 5 5 5 . . . . . . 
        . . . . . . . 5 5 . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . . f . . . . . . . 
        . . . . . . . . f . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        `,
    img`
        . . . . . . 3 3 3 3 . . . . . . 
        . . . . . 3 3 3 3 3 3 . . . . . 
        . . . . 3 3 3 3 3 3 3 3 . . . . 
        . . . . 3 3 3 3 3 3 3 3 . . . . 
        . . . . 3 3 3 3 3 3 3 3 . . . . 
        . . . . 3 3 3 3 3 3 3 3 . . . . 
        . . . . . 3 3 3 3 3 3 . . . . . 
        . . . . . 3 3 3 3 3 3 . . . . . 
        . . . . . . 3 3 3 3 . . . . . . 
        . . . . . . . 3 3 . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . . f . . . . . . . 
        . . . . . . . . f . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        `,
    img`
        . . . . . . f f f f . . . . . . 
        . . . . . f f f f f f . . . . . 
        . . . . f f f f f f f f . . . . 
        . . . . f f f f f f f f . . . . 
        . . . . f f f f f f f f . . . . 
        . . . . f f f f f f f f . . . . 
        . . . . . f f f f f f . . . . . 
        . . . . . f f f f f f . . . . . 
        . . . . . . f f f f . . . . . . 
        . . . . . . . f f . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . . f . . . . . . . 
        . . . . . . . . f . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        `,
    img`
        . . . . . . 1 1 1 1 . . . . . . 
        . . . . . 1 1 1 1 1 1 . . . . . 
        . . . . 1 1 1 1 1 1 1 1 . . . . 
        . . . . 1 1 1 1 1 1 1 1 . . . . 
        . . . . 1 1 1 1 1 1 1 1 . . . . 
        . . . . 1 1 1 1 1 1 1 1 . . . . 
        . . . . . 1 1 1 1 1 1 . . . . . 
        . . . . . 1 1 1 1 1 1 . . . . . 
        . . . . . . 1 1 1 1 . . . . . . 
        . . . . . . . 1 1 . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . . f . . . . . . . 
        . . . . . . . . f . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        `,
    img`
        . . . . . . a a a a . . . . . . 
        . . . . . a a a a a a . . . . . 
        . . . . a a a a a a a a . . . . 
        . . . . a a a a a a a a . . . . 
        . . . . a a a a a a a a . . . . 
        . . . . a a a a a a a a . . . . 
        . . . . . a a a a a a . . . . . 
        . . . . . a a a a a a . . . . . 
        . . . . . . a a a a . . . . . . 
        . . . . . . . a a . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . . f . . . . . . . 
        . . . . . . . . f . . . . . . . 
        . . . . . . . f . . . . . . . . 
        . . . . . . . f . . . . . . . . 
        `
    ]
    return bloon_images[Math.constrain(health - 1, 0, bloon_images.length - 1)]
}
function update_tack_shooter (sprite: Sprite) {
    timer.throttle(convertToText(sprites.readDataNumber(sprite, "tower_id")), sprites.readDataNumber(sprite, "fire_dart_delay"), function () {
        if (can_find_farthest_among_path_sprite_of_kind(sprite, SpriteKind.Enemy, sprites.readDataNumber(sprite, "tower_distance"))) {
            for (let index = 0; index <= sprites.readDataNumber(sprite, "dart_count") - 1; index++) {
                projectile = summon_dart(sprites.readDataNumber(sprite, "dart_image_index"), sprite)
                sprites.setDataNumber(projectile, "angle", index * (360 / sprites.readDataNumber(sprite, "dart_count")))
                if (average_fps > 15) {
                    transformSprites.rotateSprite(projectile, sprites.readDataNumber(projectile, "angle"))
                }
                if (debug && false) {
                    projectile.say(sprites.readDataNumber(projectile, "angle"))
                }
                sprites.setDataNumber(projectile, "dart_health", sprites.readDataNumber(sprite, "dart_health"))
                projectile.lifespan = sprites.readDataNumber(sprite, "dart_life")
                flip_tower(sprite, sprites.readDataNumber(projectile, "angle"))
                if (sprites.readDataBoolean(sprite, "dart_follow")) {
                    projectile.follow(farthest_sprite, sprites.readDataNumber(sprite, "dart_speed"))
                } else {
                    spriteutils.setVelocityAtAngle(projectile, spriteutils.degreesToRadians(sprites.readDataNumber(projectile, "angle") + 90), sprites.readDataNumber(sprite, "dart_speed"))
                }
            }
        }
    })
}
function set_ui_icons () {
    info.setScore(100)
    info.setLife(100)
}
function monkey_buccaneer_right_click () {
    blockMenu.setColors(1, 15)
    tower_options = ["Cancel", "Sell for $" + sprites.readDataNumber(overlapping_sprite, "sell_price")]
    if (sprites.readDataNumber(overlapping_sprite, "fire_dart_delay") > sprites.readDataNumber(overlapping_sprite, "fire_dart_delay_min")) {
        tower_options.push("Decrease firing delay ($50) to " + (sprites.readDataNumber(overlapping_sprite, "fire_dart_delay") - 200) + " ms")
    }
    if (sprites.readDataNumber(overlapping_sprite, "tower_distance") < sprites.readDataNumber(overlapping_sprite, "tower_max_distance")) {
        tower_options.push("Increase visibility ($30) to " + (sprites.readDataNumber(overlapping_sprite, "tower_distance") + 16) + " px")
    }
    if (sprites.readDataNumber(overlapping_sprite, "dart_health") < sprites.readDataNumber(overlapping_sprite, "dart_health_max")) {
        tower_options.push("Increase dart durability ($40) to " + (sprites.readDataNumber(overlapping_sprite, "dart_health") + 1) + " Bloons")
    }
    blockMenu.showMenu(tower_options, MenuStyle.List, MenuLocation.BottomHalf)
    wait_for_menu_select()
    if (blockMenu.selectedMenuIndex() == 0) {
    	
    } else if (blockMenu.selectedMenuIndex() == 1) {
        info.changeScoreBy(sprites.readDataNumber(overlapping_sprite, "sell_price"))
        overlapping_sprite.destroy()
    } else if (blockMenu.selectedMenuOption().includes("Decrease firing delay") && info.score() >= 50) {
        sprites.changeDataNumberBy(overlapping_sprite, "fire_dart_delay", -200)
        sprites.changeDataNumberBy(overlapping_sprite, "sell_price", 30)
        overlapping_sprite.startEffect(effects.halo, 1000)
        change_score(-50)
    } else if (blockMenu.selectedMenuOption().includes("Increase visibility") && info.score() >= 30) {
        sprites.changeDataNumberBy(overlapping_sprite, "tower_distance", 16)
        sprites.changeDataNumberBy(overlapping_sprite, "sell_price", 20)
        overlapping_sprite.startEffect(effects.halo, 1000)
        change_score(-30)
    } else if (blockMenu.selectedMenuOption().includes("Increase dart durability") && info.score() >= 40) {
        sprites.changeDataNumberBy(overlapping_sprite, "dart_health", 1)
        sprites.changeDataNumberBy(overlapping_sprite, "sell_price", 30)
        overlapping_sprite.startEffect(effects.halo, 1000)
        change_score(-40)
    } else {
        sprite_cursor_pointer.say("Not enough money!", 1000)
    }
}
function set_map_under_the_sea () {
    bloon_paths = []
    start_x = 3
    start_y = 0
    land_tiles = [sprites.castle.tilePath5]
    water_tiles = [sprites.castle.tilePath5]
    for (let tilemap2 of [tiles.createMap(tilemap`level18`), tiles.createMap(tilemap`level19`)]) {
        tiles.loadMap(tilemap2)
        bloon_paths.push(scene.aStar(tiles.getTilesByType(assets.tile`tile_bloon_start`)[0], tiles.getTilesByType(assets.tile`tile_bloon_end`)[0]))
    }
    tiles.setTilemap(tilemap`level7`)
    scene.setBackgroundColor(13)
}
function get_farthest_among_path_sprite_of_kind (sprite: Sprite, kind: number, max_distance: number) {
    progress = 0
    for (let sprite2 of sprites.allOfKind(kind)) {
        if (scene.spritePercentPathCompleted(sprite2) >= progress) {
            if (spriteutils.distanceBetween(sprite, sprite2) <= max_distance || max_distance == 0) {
                sprite_farthest_among_path = sprite2
                progress = scene.spritePercentPathCompleted(sprite2)
            }
        }
    }
    return sprite_farthest_among_path
}
function summon_tack_shooter () {
    sprite_tower = sprites.create(img`
        . . . . . f f f f f f . . . . . 
        . . f f f 3 3 3 3 3 3 f f f . . 
        . f d d d d d d d d d d d d f . 
        . . f f 3 3 3 3 3 3 3 3 f f . . 
        . . . f 3 3 3 3 3 3 3 3 f . . . 
        . . . f c c 3 c c 3 c c f . . . 
        . . f c c c 3 c c 3 c c c f . . 
        . f c c c 3 3 c c 3 3 c c c f . 
        f c c c 3 3 3 c c 3 3 3 c c c f 
        f c c f 3 3 3 c c 3 3 3 f c c f 
        . f f f 3 3 3 c c 3 3 3 f f f . 
        . . . f 3 3 3 3 3 3 3 3 f . . . 
        . . . f 3 3 3 3 3 3 3 3 f . . . 
        . . f f f f f f f f f f f f . . 
        . f c c c c c c c c c c c c f . 
        . . f f f f f f f f f f f f . . 
        `, SpriteKind.Tower)
    sprite_tower.setPosition(sprite_cursor_pointer.x, sprite_cursor_pointer.y)
    sprites.setDataNumber(sprite_tower, "fire_dart_delay", 1000)
    sprites.setDataNumber(sprite_tower, "fire_dart_delay_min", 100)
    sprites.setDataNumber(sprite_tower, "tower_id", tower_counter)
    sprites.setDataNumber(sprite_tower, "tower_distance", 40)
    sprites.setDataString(sprite_tower, "name", "tack_shooter")
    sprites.setDataNumber(sprite_tower, "sell_price", 35)
    sprites.setDataNumber(sprite_tower, "dart_speed", 150)
    sprites.setDataNumber(sprite_tower, "dart_life", 100)
    sprites.setDataNumber(sprite_tower, "dart_count", 8)
    sprites.setDataNumber(sprite_tower, "dart_count_max", 16)
    sprites.setDataNumber(sprite_tower, "dart_health", 1)
    sprites.setDataNumber(sprite_tower, "dart_health_max", 3)
    sprites.setDataBoolean(sprite_tower, "dart_follow", false)
    sprites.setDataNumber(sprite_tower, "dart_image_index", 1)
    if (user_monkey_shadows) {
        create_shadow(sprite_tower, img`
            . . . f f f f f f f f . . . 
            . f f f f f f f f f f f f . 
            f f f f f f f f f f f f f f 
            f f f f f f f f f f f f f f 
            f f f f f f f f f f f f f f 
            . f f f f f f f f f f f f . 
            . . . f f f f f f f f . . . 
            `)
    }
    tower_counter += 1
    change_score(-30)
}
function dart_monkey_right_click () {
    blockMenu.setColors(1, 15)
    tower_options = ["Cancel", "Sell for $" + sprites.readDataNumber(overlapping_sprite, "sell_price")]
    if (sprites.readDataNumber(overlapping_sprite, "fire_dart_delay") > sprites.readDataNumber(overlapping_sprite, "fire_dart_delay_min")) {
        tower_options.push("Decrease firing delay ($50) to " + (sprites.readDataNumber(overlapping_sprite, "fire_dart_delay") - 200) + " ms")
    }
    if (sprites.readDataNumber(overlapping_sprite, "tower_distance") < sprites.readDataNumber(overlapping_sprite, "tower_max_distance")) {
        tower_options.push("Increase visibility ($30) to " + (sprites.readDataNumber(overlapping_sprite, "tower_distance") + 16) + " px")
    }
    if (sprites.readDataNumber(overlapping_sprite, "dart_health") < sprites.readDataNumber(overlapping_sprite, "dart_health_max")) {
        tower_options.push("Increase dart durability ($40) to " + (sprites.readDataNumber(overlapping_sprite, "dart_health") + 1) + " Bloons")
    }
    blockMenu.showMenu(tower_options, MenuStyle.List, MenuLocation.BottomHalf)
    wait_for_menu_select()
    if (blockMenu.selectedMenuIndex() == 0) {
    	
    } else if (blockMenu.selectedMenuIndex() == 1) {
        info.changeScoreBy(sprites.readDataNumber(overlapping_sprite, "sell_price"))
        overlapping_sprite.destroy()
    } else if (blockMenu.selectedMenuOption().includes("Decrease firing delay") && info.score() >= 50) {
        sprites.changeDataNumberBy(overlapping_sprite, "fire_dart_delay", -200)
        sprites.changeDataNumberBy(overlapping_sprite, "sell_price", 30)
        overlapping_sprite.startEffect(effects.halo, 1000)
        change_score(-50)
    } else if (blockMenu.selectedMenuOption().includes("Increase visibility") && info.score() >= 30) {
        sprites.changeDataNumberBy(overlapping_sprite, "tower_distance", 16)
        sprites.changeDataNumberBy(overlapping_sprite, "sell_price", 20)
        overlapping_sprite.startEffect(effects.halo, 1000)
        change_score(-30)
    } else if (blockMenu.selectedMenuOption().includes("Increase dart durability") && info.score() >= 40) {
        sprites.changeDataNumberBy(overlapping_sprite, "dart_health", 1)
        sprites.changeDataNumberBy(overlapping_sprite, "sell_price", 30)
        overlapping_sprite.startEffect(effects.halo, 1000)
        change_score(-40)
    } else {
        sprite_cursor_pointer.say("Not enough money!", 1000)
    }
}
function create_shadow (sprite: Sprite, shadow: Image) {
    sprites.setDataSprite(sprite, "shadow_sprite", shader.createImageShaderSprite(shadow, shader.ShadeLevel.One))
    sprites.readDataSprite(sprite, "shadow_sprite").setPosition(sprite.x, sprite.bottom)
    sprites.readDataSprite(sprite, "shadow_sprite").z = sprite.z - 1
}
function set_map_eerie_swamp () {
    bloon_paths = []
    start_x = 2
    start_y = 0
    land_tiles = [assets.tile`tile_right_lilypad_dark_water`, assets.tile`tile_left_lilypad_dark_water`, sprites.builtin.forestTiles0]
    water_tiles = [assets.tile`tile_deep_dark_water`]
    for (let tilemap2 of [tiles.createMap(tilemap`level14`), tiles.createMap(tilemap`level15`)]) {
        tiles.loadMap(tilemap2)
        bloon_paths.push(scene.aStar(tiles.getTilesByType(assets.tile`tile_bloon_start`)[0], tiles.getTilesByType(assets.tile`tile_bloon_end`)[0]))
    }
    tiles.setTilemap(tilemap`level4`)
    scene.setBackgroundColor(6)
}
function can_find_farthest_among_path_sprite_of_kind (sprite: Sprite, kind: number, max_distance: number) {
    for (let sprite2 of sprites.allOfKind(kind)) {
        if (spriteutils.distanceBetween(sprite, sprite2) <= max_distance || max_distance == 0) {
            return true
        }
    }
    return false
}
sprites.onCreated(SpriteKind.Projectile, function (sprite) {
    sprite.setFlag(SpriteFlag.GhostThroughSprites, false)
    sprite.setFlag(SpriteFlag.GhostThroughTiles, true)
    sprite.setFlag(SpriteFlag.GhostThroughWalls, false)
})
function change_score (diff: number) {
    if (!(debug)) {
        info.changeScoreBy(diff)
    }
}
sprites.onDestroyed(SpriteKind.Enemy, function (sprite) {
    sprite_shadow = sprites.readDataSprite(sprite, "shadow_sprite")
    if (sprite_shadow) {
        sprite_shadow.destroy()
    }
})
function summon_bloon (col: number, row: number, health: number, speed: number, path: number) {
    sprite_bloon = sprites.create(bloon_image_from_health(health), SpriteKind.Enemy)
    tiles.placeOnTile(sprite_bloon, tiles.getTileLocation(col, row))
    sprites.setDataNumber(sprite_bloon, "health", health)
    sprites.setDataNumber(sprite_bloon, "original_health", health)
    scene.followPath(sprite_bloon, bloon_paths[path], speed)
}
blockMenu.onMenuOptionSelected(function (option, index) {
    menu_option_selected = true
})
function set_map_city_park () {
    bloon_paths = []
    start_x = 1
    start_y = 0
    land_tiles = [assets.tile`tile_grass`, sprites.castle.tileGrass1, sprites.castle.tileGrass3, sprites.castle.tileGrass2]
    water_tiles = [
    assets.tile`tile_water`,
    assets.tile`tile_left_grass_edge_water`,
    assets.tile`tile_top_left_grass_edge_water`,
    assets.tile`tile_top_right_grass_edge_water`,
    assets.tile`tile_right_grass_edge_water`,
    assets.tile`tile_bottom_right_grass_edge_water`,
    assets.tile`tile_bottom_grass_edge_water`,
    assets.tile`tile_bottom_left_grass_edge_water`
    ]
    for (let tilemap2 of [tiles.createMap(tilemap`level12`), tiles.createMap(tilemap`level13`)]) {
        tiles.loadMap(tilemap2)
        bloon_paths.push(scene.aStar(tiles.getTilesByType(assets.tile`tile_bloon_start`)[0], tiles.getTilesByType(assets.tile`tile_bloon_end`)[0]))
    }
    tiles.setTilemap(tilemap`level3`)
    scene.setBackgroundColor(7)
}
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (sprite, otherSprite) {
    sprites.changeDataNumberBy(otherSprite, "health", -1)
    sprites.changeDataNumberBy(sprite, "dart_health", -1)
    if (sprites.readDataNumber(otherSprite, "health") <= 0) {
        info.changeScoreBy(sprites.readDataNumber(otherSprite, "original_health") * 2)
        if (user_bloon_particles) {
            otherSprite.destroy(effects.trail, 100)
        } else {
            otherSprite.destroy()
        }
    } else {
        otherSprite.setImage(bloon_image_from_health(sprites.readDataNumber(otherSprite, "health")))
    }
    if (sprites.readDataNumber(sprite, "dart_health") <= 0) {
        sprite.destroy()
    }
})
// TODO: 
// 
let sprite_bloon: Sprite = null
let progress = 0
let dart_images: Image[] = []
let sprite_farthest_among_path: Sprite = null
let strength = 0
let sprite_cursor: Sprite = null
let start_y = 0
let start_x = 0
let bloon_images: Image[] = []
let bloon_paths: tiles.Location[][] = []
let bloon_path = 0
let water_tiles: Image[] = []
let sprite_tower: Sprite = null
let sprite_shadow: Sprite = null
let sprite_cursor_pointer: Sprite = null
let overlapping_sprite: Sprite = null
let tower_options: string[] = []
let land_tiles: Image[] = []
let projectile: Sprite = null
let farthest_sprite: Sprite = null
let average_fps = 0
let fps_count = 0
let fps = 0
let tower_counter = 0
let menu_open = false
let in_wave = false
let starting_wave = false
let wave = 0
let game_started = false
let menu_option_selected = false
let user_bloon_particles = false
let user_monkey_shadows = false
let debug = false
debug = true
user_monkey_shadows = true
let user_bloon_shadows = true
user_bloon_particles = true
color.setPalette(
color.Black
)
menu_option_selected = false
game_started = false
set_map_city_park()
blockMenu.setControlsEnabled(false)
blockMenu.setColors(1, 15)
blockMenu.showMenu([
"City Park",
"Field of Flowers",
"Eerie Swamp",
"Sand Castle",
"The Dark Dungeon",
"Figure Eights (And Zeros)",
"Under the Sea",
"Bloon's Forest"
], MenuStyle.Grid, MenuLocation.BottomHalf)
timer.background(function () {
    timer.background(function () {
        BTD5Music.playMenuTheme()
    })
    for (let index = 0; index <= 80; index++) {
        music.setVolume(index)
        pause(10)
    }
})
fade_out(2000, true)
blockMenu.setControlsEnabled(true)
while (!(menu_option_selected)) {
    if (blockMenu.selectedMenuIndex() == 0) {
        set_map_city_park()
    } else if (blockMenu.selectedMenuIndex() == 1) {
        set_map_field_of_flowers()
    } else if (blockMenu.selectedMenuIndex() == 2) {
        set_map_eerie_swamp()
    } else if (blockMenu.selectedMenuIndex() == 3) {
        set_map_sand_castle()
    } else if (blockMenu.selectedMenuIndex() == 4) {
        set_map_dark_dungeon()
    } else if (blockMenu.selectedMenuIndex() == 5) {
        set_map_figure_eights()
    } else if (blockMenu.selectedMenuIndex() == 6) {
        set_map_under_the_sea()
    } else if (blockMenu.selectedMenuIndex() == 7) {
        set_map_bloons_forest()
    }
    pause(100)
}
blockMenu.closeMenu()
timer.background(function () {
    for (let index = 0; index <= 80; index++) {
        music.setVolume(80 - index)
        pause(10)
    }
    BTD5Music.stop()
})
fade_in(2000, true)
pause(1000)
create_cursor()
set_ui_icons()
initialize_variables()
timer.background(function () {
    timer.background(function () {
        BTD5Music.playGameTheme()
    })
    for (let index = 0; index <= 80; index++) {
        music.setVolume(index)
        pause(10)
    }
})
fade_out(2000, false)
game_started = true
game.onUpdate(function () {
    sprite_cursor_pointer.top = sprite_cursor.top
    sprite_cursor_pointer.left = sprite_cursor.left
})
game.onUpdate(function () {
    fps_count += 1
})
game.onUpdateInterval(1000, function () {
    fps = fps_count
    average_fps += fps
    average_fps = Math.round(average_fps / 2)
    fps_count = 0
    if (debug && false) {
        sprite_cursor.say("" + fps + ", " + average_fps, 1000)
    }
    if (debug && false) {
        sprite_cursor.say("" + user_bloon_particles + ", " + user_bloon_shadows, 1000)
    }
    if (fps < 40) {
        user_bloon_particles = false
    } else if (average_fps > 40) {
        user_bloon_particles = true
    }
    if (fps < 30) {
        user_bloon_shadows = false
    } else if (average_fps > 30) {
        user_bloon_shadows = true
    }
})
forever(function () {
    if (overlapping_sprite_of_kind(sprite_cursor_pointer, SpriteKind.Tower)) {
        sprite_cursor.setImage(img`
            2 . . . . . . . . . 
            f f . . . . . . . . 
            f 9 f . . . . . . . 
            f 9 9 f . . . . . . 
            f 9 9 9 f . . . . . 
            f 9 9 9 9 f . . . . 
            f 9 9 9 9 9 f . . . 
            f 9 9 9 9 9 9 f . . 
            f 9 9 9 9 9 9 9 f . 
            f 9 9 f 9 f f f f f 
            f 9 f f 9 f . . . . 
            f f . . f 9 f . . . 
            f . . . f 9 f . . . 
            . . . . . f 9 f . . 
            . . . . . f 9 f . . 
            . . . . . . f . . . 
            `)
    } else {
        sprite_cursor.setImage(img`
            2 . . . . . . . . . 
            f f . . . . . . . . 
            f 1 f . . . . . . . 
            f 1 1 f . . . . . . 
            f 1 1 1 f . . . . . 
            f 1 1 1 1 f . . . . 
            f 1 1 1 1 1 f . . . 
            f 1 1 1 1 1 1 f . . 
            f 1 1 1 1 1 1 1 f . 
            f 1 1 f 1 f f f f f 
            f 1 f f 1 f . . . . 
            f f . . f 1 f . . . 
            f . . . f 1 f . . . 
            . . . . . f 1 f . . 
            . . . . . f 1 f . . 
            . . . . . . f . . . 
            `)
    }
})
forever(function () {
    for (let sprite of sprites.allOfKind(SpriteKind.Enemy)) {
        sprite_shadow = sprites.readDataSprite(sprite, "shadow_sprite")
        sprites.setDataBoolean(sprite, "has_shadow", !(spriteutils.isDestroyed(sprite_shadow)))
        if (false) {
            sprite.say(sprites.readDataBoolean(sprite, "has_shadow"))
        }
        if (sprites.readDataBoolean(sprite, "has_shadow")) {
            sprite_shadow.setPosition(sprite.x, sprite.bottom)
        }
        if (user_bloon_shadows) {
            if (!(sprites.readDataBoolean(sprite, "has_shadow"))) {
                sprites.setDataSprite(sprite, "shadow_sprite", shader.createImageShaderSprite(img`
                    . . . f f f f . . . 
                    . f f f f f f f f . 
                    f f f f f f f f f f 
                    . f f f f f f f f . 
                    . . . f f f f . . . 
                    `, shader.ShadeLevel.One))
                sprites.readDataSprite(sprite, "shadow_sprite").x = sprite.x
                sprites.readDataSprite(sprite, "shadow_sprite").y = sprite.bottom
                sprites.readDataSprite(sprite, "shadow_sprite").lifespan = 5000
                sprites.readDataSprite(sprite, "shadow_sprite").setFlag(SpriteFlag.Ghost, true)
                sprites.setDataBoolean(sprite, "has_shadow", true)
            }
        } else {
            if (sprites.readDataBoolean(sprite, "has_shadow")) {
                sprite_shadow.destroy()
                sprites.setDataBoolean(sprite, "has_shadow", false)
            }
        }
    }
})
forever(function () {
    for (let sprite of sprites.allOfKind(SpriteKind.Tower)) {
        if (sprites.readDataString(sprite, "name") == "dart_monkey") {
            update_dart_monkey(sprite)
        } else if (sprites.readDataString(sprite, "name") == "tack_shooter") {
            update_tack_shooter(sprite)
        } else if (sprites.readDataString(sprite, "name") == "sniper_monkey") {
            update_sniper_monkey(sprite)
        } else if (sprites.readDataString(sprite, "name") == "monkey_buccaneer") {
            update_monkey_buccaneer(sprite)
        }
    }
})
