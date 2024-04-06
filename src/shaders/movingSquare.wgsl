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