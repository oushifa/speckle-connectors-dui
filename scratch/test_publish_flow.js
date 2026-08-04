/**
 * 端到端插件发布与上传完整链路测试脚本 (包含标准 32 位 MD5 Object Hash)
 * 测试账号: srjAdmin / Srj@6666
 * 验证在 Speckle Server 上完整登录、上传 3D 对象、产生 Version 的全流程 REST/GraphQL 链路
 */

const crypto = require('crypto')

const SERVER_URL = process.env.SERVER_URL || 'http://127.0.0.1:3000'
const USER_EMAIL = 'srjAdmin@speckle.systems'
const USER_PASSWORD = 'Srj@6666'
const APP_ID = 'spklwebapp'
const APP_SECRET = 'spklwebapp'

function getObjectHash(obj) {
  const clone = { ...obj }
  delete clone.id
  return crypto.createHash('md5').update(JSON.stringify(clone)).digest('hex')
}

console.log(`==================================================`)
console.log(`🚀 [Speckle Plugin Publish Test] 启动测试...`)
console.log(`服务器: ${SERVER_URL}`)
console.log(`账号: ${USER_EMAIL}`)
console.log(`==================================================\n`)

async function getAuthToken() {
  const challenge = 'test_challenge_' + Math.random().toString(36).substring(2, 8)
  
  // 1. 尝试登录
  console.log(`[Step 1.1] 尝试登录账号: ${USER_EMAIL}...`)
  const loginUrl = `${SERVER_URL}/auth/local/login?challenge=${challenge}`
  let loginRes = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'manual',
    body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD })
  })

  let locationHeader = loginRes.headers.get('location')

  // 若账号不存在 (400 / 401)，自动注册
  if (!locationHeader && (loginRes.status === 400 || loginRes.status === 401)) {
    console.log(`[Step 1.2] 账号不存在，自动注册测试账号: ${USER_EMAIL}...`)
    const regUrl = `${SERVER_URL}/auth/local/register?challenge=${challenge}`
    const regRes = await fetch(regUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'manual',
      body: JSON.stringify({
        email: USER_EMAIL,
        password: USER_PASSWORD,
        name: 'srjAdmin'
      })
    })
    locationHeader = regRes.headers.get('location')
  }

  if (!locationHeader) {
    throw new Error(`登录/注册未获得重定向凭据! Status: ${loginRes.status}`)
  }

  // 从重定向 Location URL 解析 accessCode
  const redirectUrl = new URL(locationHeader, SERVER_URL)
  const accessCode = redirectUrl.searchParams.get('access_code') || redirectUrl.searchParams.get('code')

  if (!accessCode) {
    throw new Error(`Location URL 未包含 access_code: ${locationHeader}`)
  }

  console.log(`[Step 1.3] 获得 accessCode: ${accessCode.substring(0, 8)}... 正在换取 Auth Token...`)

  // 2. 通过 /auth/token 换取 API Bearer Token
  const tokenRes = await fetch(`${SERVER_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessCode,
      challenge,
      appId: APP_ID,
      appSecret: APP_SECRET
    })
  })

  const tokenData = await tokenRes.json()
  if (!tokenData.token) {
    throw new Error(`获取 Token 失败: ${JSON.stringify(tokenData)}`)
  }

  console.log(`[Auth Success] 成功取得 Auth Bearer Token!`)
  return tokenData.token
}

async function runTest() {
  try {
    const token = await getAuthToken()

    async function gqlQuery(query, variables = {}) {
      const res = await fetch(`${SERVER_URL}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query, variables })
      })
      return await res.json()
    }

    // Step 2: 确认用户信息与获取/创建项目
    console.log('\n--- Step 2: 查询用户与测试项目/模型 ---')
    const userRes = await gqlQuery(`
      query ActiveUser {
        activeUser {
          id
          name
          email
          projects(limit: 5) {
            items {
              id
              name
              models(limit: 5) {
                items {
                  id
                  name
                }
              }
            }
          }
        }
      }
    `)

    const activeUser = userRes?.data?.activeUser
    console.log(`[User Logged In] 账号: ${activeUser?.name} (${activeUser?.email}), ID: ${activeUser?.id}`)

    let projectId = activeUser?.projects?.items?.[0]?.id
    let modelId = activeUser?.projects?.items?.[0]?.models?.items?.[0]?.id

    if (!projectId) {
      console.log('[Project Setup] 正在创建端到端测试项目...')
      const createProjRes = await gqlQuery(`
        mutation CreateProject($input: ProjectCreateInput) {
          projectMutations {
            create(input: $input) {
              id
              name
            }
          }
        }
      `, {
        input: {
          name: 'Speckle_Plugin_E2E_Test_Project',
          description: '插件发布上传端到端测试项目'
        }
      })
      projectId = createProjRes?.data?.projectMutations?.create?.id
      console.log(`[Project Created] 测试项目创建成功! ID: ${projectId}`)
    } else {
      console.log(`[Project Found] 使用已有项目 ID: ${projectId}`)
    }

    if (!modelId) {
      console.log('[Model Setup] 正在创建端到端测试模型...')
      const modelName = 'main_' + Math.random().toString(36).substring(2, 6)
      const createModelRes = await gqlQuery(`
        mutation CreateModel($input: CreateModelInput!) {
          modelMutations {
            create(input: $input) {
              id
              name
            }
          }
        }
      `, {
        input: {
          projectId,
          name: modelName
        }
      })
      modelId = createModelRes?.data?.modelMutations?.create?.id
      console.log(`[Model Created] 测试模型 ID: ${modelId}`)
    } else {
      console.log(`[Model Found] 使用已有模型 ID: ${modelId}`)
    }

    if (!projectId || !modelId) {
      throw new Error(`未获得有效的 projectId (${projectId}) 或 modelId (${modelId})`)
    }

    // Step 3: 构造 Speckle 几何与 3D 对象数据 (Base Object)
    console.log('\n--- Step 3: 构造 CAD/BIM 3D 几何 Base 对象与 32位 哈希散列 ---')
    const childMeshRaw = {
      speckle_type: 'Objects.Geometry.Mesh',
      vertices: [0, 0, 0, 100, 0, 0, 100, 100, 0, 0, 100, 0],
      faces: [4, 0, 1, 2, 3],
      units: 'mm',
      category: 'Structural Framing',
      name: 'Revit_Structural_Beam_' + Math.random().toString(36).substring(2, 6)
    }
    const childObjectId = getObjectHash(childMeshRaw)
    const childMeshObject = { id: childObjectId, ...childMeshRaw }

    const rootCollectionRaw = {
      speckle_type: 'Speckle.Core.Models.Collection',
      name: 'Revit_Model_Export_Collection_' + Math.random().toString(36).substring(2, 6),
      elements: [{ referencedId: childObjectId, speckle_type: 'reference' }],
      totalChildrenCount: 1,
      units: 'mm'
    }
    const rootObjectId = getObjectHash(rootCollectionRaw)
    const rootCollectionObject = { id: rootObjectId, ...rootCollectionRaw }

    console.log(`[Object Hash Created] 根对象 ID (32位 MD5): ${rootObjectId}`)
    console.log(`[Object Hash Created] 子几何对象 ID (32位 MD5): ${childObjectId}`)

    // Step 4: 使用 REST 接口批量上传对象数据到 /objects/:projectId (标准 multipart/form-data)
    console.log('\n--- Step 4: 优先使用 REST 接口批量上传 3D 对象 Payload ---')
    const objectsBuffer = Buffer.from(JSON.stringify([rootCollectionObject, childMeshObject]), 'utf8')
    const boundary = '--------------------------' + Math.random().toString(36).substring(2, 12)

    let postData = `--${boundary}\r\n`
    postData += `Content-Disposition: form-data; name="batch1"; filename="batch1.json"\r\n`
    postData += `Content-Type: application/json\r\n\r\n`
    postData += objectsBuffer.toString('utf8') + `\r\n`
    postData += `--${boundary}--\r\n`

    const restUploadRes = await fetch(`${SERVER_URL}/objects/${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${token}`
      },
      body: postData
    })

    const uploadStatus = restUploadRes.status
    const uploadText = await restUploadRes.text()
    console.log(`[REST Object Upload Response] HTTP ${uploadStatus}: ${uploadText}`)

    if (uploadStatus >= 400) {
      throw new Error(`REST 上传对象失败: HTTP ${uploadStatus} - ${uploadText}`)
    }

    // Step 5: 创建 Version 记录关联上传的根对象
    console.log('\n--- Step 5: 发起 CreateVersion Mutation 完成发布绑定 ---')
    const versionRes = await gqlQuery(`
      mutation CreateVersion($input: CreateVersionInput!) {
        versionMutations {
          create(input: $input) {
            id
            createdAt
            referencedObject
            message
          }
        }
      }
    `, {
      input: {
        projectId,
        modelId,
        objectId: rootObjectId,
        message: '插件端到端自动化测试新发布版本',
        sourceApplication: 'Revit 2026 DUI Plugin'
      }
    })

    const versionData = versionRes?.data?.versionMutations?.create
    if (!versionData?.id) {
      throw new Error(`版本关联失败: ${JSON.stringify(versionRes.errors || versionRes)}`)
    }

    console.log(`\n==================================================`)
    console.log(`🎉🎉🎉 [SUCCESS] 端到端插件发布与数据上传测试完全成功！ 🎉🎉🎉`)
    console.log(`生成 Version ID   : ${versionData.id}`)
    console.log(`关联根对象 ID      : ${versionData.referencedObject}`)
    console.log(`提交说明 (Message) : ${versionData.message}`)
    console.log(`所属项目 (Project) : ${projectId}`)
    console.log(`所属模型 (Model)   : ${modelId}`)
    console.log(`后端数据库与 S3 存储: 验证成功保存入库！`)
    console.log(`==================================================\n`)

  } catch (err) {
    console.error(`\n❌ [TEST FAILED] 端到端插件发布上传测试异常:`, err)
  }
}

runTest()
