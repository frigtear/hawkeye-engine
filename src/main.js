const velocity = 0.01
const XrightBound = 1.5
const XleftBound = -0.3


// Increase resolution of canvas to match display size
function resizeCanvasToDisplaySize(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth * dpr;
    const height = canvas.clientHeight * dpr;
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
}


async function main(){
    const adapter = await navigator.gpu.requestAdapter()
    const format = navigator.gpu.getPreferredCanvasFormat()
    const device = await adapter.requestDevice()
    const canvas = document.querySelector("#main")
    const context = canvas.getContext("webgpu")
    resizeCanvasToDisplaySize(canvas);
    context.configure({
        device, 
        format:format
    })

    // Two 32 bit integers for position, 1 32 bit float for color
    const bufferSize = 2 * 4 + 1 * 4 + 4
    const valuesPosIndex = 0
    const valuesColorIndex = 2
    const storage = device.createBuffer({
        label:"Triangle Color and Position offset storage buffer",
        size:bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    })

    
    const movingTriangle = device.createShaderModule({
        label:"moving triangle",
        code:`
        struct offsetBuffer{
            offset : vec2f,
            color : f32
        }

        struct vertexOutput{
            @builtin(position) pos : vec4f,
            @location(0) color : vec4f,
        }
        
        @group(0) @binding(0) var<storage, read> storeroom : offsetBuffer;
        
        @vertex
        fn vs(@builtin(vertex_index) index : u32) -> vertexOutput{
            // Start position at center left 
            let base = array(
                // Bottom left
                vec2f(-0.8, 0),
                // Top 
                vec2f(-0.6, 0.3),
                // Bottom right
                vec2f(-0.4, 0),
                // Lower triangle top right
                vec2f(-0.4, 0),
                // Lower triangle top left
                vec2f(-0.8, 0),
                // Lower triangle bottom
                vec2f(-0.6, -0.3),
            );

            var colors = array<vec4f, 3>(
                // Green base, Blue offset
                vec4f(0.0, 1.0, storeroom.color, 1.0),
                // Red Base, Green offset
                vec4f(1.0, storeroom.color, 0.0, 1.0),
                // Blue base, Red offset
                vec4f(storeroom.color, 0.0, 1.0, 1.0),
            );
            
            var output : vertexOutput;
            output.color = colors[index%3];
            output.pos = vec4f(base[index] + storeroom.offset, 0.0, 1.0);
            return output;
        }
        
        @fragment 
        fn fs(input : vertexOutput) -> @location(0) vec4f{
            // interpolate color based on vertex position    
            return input.color;
        }
        `
    })


    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: movingTriangle,
            entryPoint: 'vs',
        },
        fragment: {
            module: movingTriangle,
            entryPoint: 'fs',
            targets: [{format:format}]
        },
    
    })


    const mainBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{binding:0, resource: {buffer : storage}}],
    })


    const renderPassDescriptor = ({
        colorAttachments: [{
            // Clear screen to black
            clearValue: [0,0,0,1],
            loadOp:'clear',
            storeOp:'store'
        }]
        
    })

  
    let increasing = true
    let colorOffset = 0.0
    let Xoffset = 0.0
    async function render(){
        renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline)
        values = new Float32Array((bufferSize - 4) / 4)
        values.set([Xoffset, valuesPosIndex], 0)
        values.set([colorOffset], valuesColorIndex)
        device.queue.writeBuffer(storage, 0, values)
        pass.setBindGroup(0, mainBindGroup)
        // Draw 6 vertices to make sqare out of two triangles
        pass.draw(6)
        pass.end()
        const commands = encoder.finish()
        device.queue.submit([commands])

        if (increasing === true){
            Xoffset += velocity
            colorOffset += velocity
        }
        else{
            Xoffset -= velocity
            colorOffset -= velocity
        }
        if (Xoffset >= XrightBound){
            increasing = !increasing
        }
        if(Xoffset <= XleftBound){
            increasing = !increasing
        }
        requestAnimationFrame(render)
    }

    render()
}

if (navigator.gpu){
    main()
}
else{
    throw new Error("Webgpu not supported")
}