using Luxor
using Colors

function whiten(col::Colorant, f=0.5)
    hsl = convert(HSL, col)
    h, s, l = hsl.h, hsl.s, hsl.l
    return convert(RGB, HSL(h, s, f))
end

function drawball(
    pos, ballradius, col::Colorant;
    fromlum=0.2,
    tolum=1.0
)
    @layer begin
        translate(pos)
        for i in ballradius:-0.5:1
            sethue(whiten(col, rescale(i, ballradius, 0.5, fromlum, tolum)))
            offset = rescale(i, ballradius, 0.5, 0, -ballradius / 2)
            circle(O + (-offset, offset), i, :fill)
        end
    end
    return
end

function branch(🐢::Turtle, step, depth, angle)
    # rescale according to current depth (0 to 4)
    angle = rescale(depth, 4, 1, 30, 14)
    step = rescale(step, 4, 1, 8, 4)
    setline(rescale(depth, 4, 1, 6, 2))
    if depth > 0
        Forward(🐢, step)
        Turn(🐢, angle)
        # recursive right subtree
        branch(🐢, 0.8 * step, depth - 1, angle)
        Turn(🐢, -2angle)
        # recursive left subtree
        branch(🐢, 0.8 * step, depth - 1, angle)
        Turn(🐢, angle)
        Forward(🐢, -step)
    end
    # green to blue hues
    sethue(Oklch(0.5, 0.5, rescale(depth, 1, 4, 150, 230)))
    if depth != 4
        drawball(Point(🐢.xpos, 🐢.ypos), 25, getcolor())
    end
    return
end

function main(fname)
    Drawing(600, 600, fname)
    origin()
    # border
    squircle(O, 298, 298, rt=0.65, action=:path)
    sethue("black")
    fillpreserve()
    squircle(O, 276, 276, rt=0.65, reversepath=true, action=:path)
    clip()
    tiles = Tiler(600, 600, 2, 2, margin=0)
    for (pos, n) in tiles
        sethue([Luxor.julia_red, Luxor.julia_green, Luxor.julia_blue, Luxor.julia_purple][mod1(n, 4)])
        box(pos, tiles.tilewidth, tiles.tilewidth, :fill)
    end
    clipreset()

    # tree
    translate(Point(0, 190))
    rotate(-π / 2)
    🐢 = Turtle()
    Pencolor(🐢, "white")
    # ... step, iterations, angle
    branch(🐢, 62, 4, 0)
    finish()
    return preview()
end

main("public/tree.svg")
