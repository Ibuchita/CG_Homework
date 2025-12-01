#version 300 es
precision mediump float;

out vec4 FragColor;

uniform float ambientStrength, specularStrength, diffuseStrength,shininess;

in vec3 Normal;//法向量
in vec3 FragPos;//相机观察的片元位置
in vec2 TexCoord;//纹理坐标
in vec4 FragPosLightSpace;//光源观察的片元位置

uniform vec3 viewPos;//相机位置
uniform vec4 u_lightPosition; //光源位置	
uniform vec3 lightColor;//入射光颜色

uniform sampler2D diffuseTexture;
uniform sampler2D depthTexture;
uniform sampler2D normalMap;        // 法线贴图采样器
uniform samplerCube cubeSampler;//盒子纹理采样器
uniform bool useNormalMap;       // 控制是否使用法线贴图


float shadowCalculation(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir)
{
    //float shadow=0.0;  //非阴影
    /*TODO3: 添加阴影计算，返回1表示是阴影，返回0表示非阴影*/

    // 执行透视除法，获得[-1,1]范围内的标准化设备坐标
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;

    // 将坐标从[-1,1]范围转换到[0,1]范围
    projCoords = projCoords * 0.5 + 0.5;

    // 获取最近深度值（来自深度贴图）
    float closestDepth = texture(depthTexture, projCoords.xy).r;

    // 获取当前片元在光源视角下的深度
    float currentDepth = projCoords.z;

    // 检查当前片元是否在阴影中
    // 添加一个小的偏移量(bias)来避免阴影失真
    float bias = max(0.005 * (1.0 - dot(normal, lightDir)), 0.0005);

    float shadow = 0.0;

    // 只有当片元在光源视野范围内才进行阴影计算
    if(projCoords.z <= 1.0) {
        // 如果当前深度大于深度贴图中的值，说明该片元被遮挡，在阴影中
        shadow = currentDepth - bias > closestDepth ? 1.0 : 0.0;
    }

    return shadow;
}       



void main()
{

    //采样纹理颜色
    vec3 TextureColor = texture(diffuseTexture, TexCoord).xyz;

    //计算光照颜色
 	vec3 norm = normalize(Normal);

	// 条件使用法线贴图
	vec3 finalNormal = norm;
	if(useNormalMap) {
		// 采样法线贴图
		vec3 normalFromMap = texture(normalMap, TexCoord).rgb;
		// 将法线从[0,1]范围转换到[-1,1]范围
		finalNormal = normalize(normalFromMap * 2.0 - 1.0);
	}
	vec3 lightDir;
	if(u_lightPosition.w==1.0)
        lightDir = normalize(u_lightPosition.xyz - FragPos);
	else lightDir = normalize(u_lightPosition.xyz);
	vec3 viewDir = normalize(viewPos - FragPos);
	vec3 halfDir = normalize(viewDir + lightDir);

    /*TODO2:根据phong shading方法计算ambient,diffuse,specular*/
    vec3  ambient,diffuse,specular;
    //增加



    // ========== 原始光照计算==========
    /*// 环境光计算 - 带简单的AO效果
    ambient = ambientStrength * lightColor;
    // 简单的fake AO:底面更暗，顶面更亮
    float ao = 1.0 - (1.0 - dot(norm, vec3(0, 1, 0))) * 0.3;
    ambient *= ao;

    // 漫反射计算 - Lambert定律
    float diff = max(dot(norm, lightDir), 0.0);
    diffuse = diffuseStrength * diff * lightColor;

    // 镜面反射计算 - Phong模型
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    specular = specularStrength * spec * lightColor;
    */



    // ========== 使用法线贴图的光照计算 ==========
    // 环境光计算 - 带简单的AO效果，使用最终法线
    ambient = ambientStrength * lightColor;
    // 简单的fake AO:底面更暗，顶面更亮
    float ao = 1.0 - (1.0 - dot(finalNormal, vec3(0, 1, 0))) * 0.3;
    ambient *= ao;

    // 漫反射计算 - 使用最终法线
    float diff = max(dot(finalNormal, lightDir), 0.0);
    diffuse = diffuseStrength * diff * lightColor;

    // 镜面反射计算 - 使用最终法线
    vec3 reflectDir = reflect(-lightDir, finalNormal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    specular = specularStrength * spec * lightColor;

  	vec3 lightReflectColor=(ambient +diffuse + specular);

    //判定是否阴影，并对各种颜色进行混合
    float shadow = shadowCalculation(FragPosLightSpace, finalNormal, lightDir);

    //vec3 resultColor =(ambient + (1.0-shadow) * (diffuse + specular))* TextureColor;
    vec3 resultColor=(1.0-shadow/2.0)* lightReflectColor * TextureColor;

    FragColor = vec4(resultColor, 1.f);
    
}


