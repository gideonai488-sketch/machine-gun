import * as sandboxManager from '../sandbox/manager.js'
import * as codemagic from './codemagic.js'
import { updateProject, getProject } from '../store/projects.js'

export async function deployWeb(projectId, { emitActivity, emitStatus }) {
  const project = await getProject(projectId)
  if (!project) throw new Error('Project not found')

  const framework = project.framework

  emitActivity({ id: `deploy-web-${Date.now()}`, type: 'build', message: 'Building for production...', status: 'running' })

  let buildCmd
  switch (framework) {
    case 'flutter':
      buildCmd = 'cd /home/user/project && flutter build web --release'
      break
    case 'react-native':
      buildCmd = 'cd /home/user/project && npx expo export --platform web'
      break
    case 'react-vite':
    default:
      buildCmd = 'cd /home/user/project && npm run build'
      break
  }

  const buildResult = await sandboxManager.runCommand(projectId, buildCmd, 120000)
  if (buildResult.exitCode !== 0) {
    emitActivity({ id: `deploy-web-${Date.now()}`, type: 'build', message: 'Production build failed', status: 'error', update: true })
    throw new Error(`Build failed: ${buildResult.stderr}`)
  }

  emitActivity({ id: `deploy-web-build`, type: 'build', message: 'Production build complete', status: 'success' })

  let buildDir
  switch (framework) {
    case 'flutter':
      buildDir = '/home/user/project/build/web'
      break
    case 'react-native':
      buildDir = '/home/user/project/dist'
      break
    case 'react-vite':
    default:
      buildDir = '/home/user/project/dist'
      break
  }

  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    emitActivity({ id: `deploy-web-upload`, type: 'build', message: 'Deploying via Surge.sh...', status: 'running' })

    const projectName = (project.name || 'devflow-app')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30)

    const domain = `${projectName}-${projectId.substring(0, 6)}.surge.sh`

    await sandboxManager.runCommand(projectId, 'npm install -g surge', 30000)
    const surgeResult = await sandboxManager.runCommand(
      projectId,
      `cd ${buildDir} && surge . ${domain} --token ${process.env.SURGE_TOKEN || 'anonymous'}`,
      60000
    )

    if (surgeResult.exitCode !== 0) {
      emitActivity({ id: `deploy-web-npx`, type: 'build', message: 'Deploying with npx serve...', status: 'running' })

      const serveResult = await sandboxManager.runCommand(
        projectId,
        `cd /home/user/project && npx serve ${buildDir.replace('/home/user/project/', '')} -l 5173 --no-clipboard`,
        5000
      )

      const sandbox = await sandboxManager.getSandbox(projectId)
      const host = sandbox.getHost(5173)
      const liveUrl = `https://${host}`

      emitActivity({ id: `deploy-web-done`, type: 'build', message: 'App deployed', status: 'success' })
      updateProject(projectId, { liveUrl, status: 'success' })
      return { url: liveUrl, method: 'sandbox-serve' }
    }

    const liveUrl = `https://${domain}`
    emitActivity({ id: `deploy-web-done`, type: 'build', message: 'Website is live!', status: 'success' })
    emitStatus({ status: 'success', liveUrl })
    updateProject(projectId, { liveUrl, status: 'success' })
    return { url: liveUrl, method: 'surge' }
  }

  emitActivity({ id: `deploy-web-cf`, type: 'build', message: 'Deploying to Cloudflare Pages...', status: 'running' })

  const projectName = (project.name || 'devflow-app')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 30)

  await sandboxManager.runCommand(projectId, 'npm install -g wrangler', 30000)

  const createResult = await sandboxManager.runCommand(
    projectId,
    `CLOUDFLARE_API_TOKEN=${process.env.CLOUDFLARE_API_TOKEN} CLOUDFLARE_ACCOUNT_ID=${process.env.CLOUDFLARE_ACCOUNT_ID} wrangler pages project create ${projectName} --production-branch main 2>&1 || true`,
    15000
  )

  const deployResult = await sandboxManager.runCommand(
    projectId,
    `CLOUDFLARE_API_TOKEN=${process.env.CLOUDFLARE_API_TOKEN} CLOUDFLARE_ACCOUNT_ID=${process.env.CLOUDFLARE_ACCOUNT_ID} wrangler pages deploy ${buildDir} --project-name=${projectName} --branch=main`,
    60000
  )

  if (deployResult.exitCode !== 0) {
    emitActivity({ id: `deploy-web-cf`, type: 'build', message: 'Cloudflare deploy failed', status: 'error', update: true })
    throw new Error(`Deploy failed: ${deployResult.stderr}`)
  }

  const urlMatch = deployResult.stdout.match(/https:\/\/[^\s]+\.pages\.dev/)
  const liveUrl = urlMatch ? urlMatch[0] : `https://${projectName}.pages.dev`

  emitActivity({ id: `deploy-web-done`, type: 'build', message: 'Website is live!', status: 'success' })
  emitStatus({ status: 'success', liveUrl })
  updateProject(projectId, { liveUrl, status: 'success' })

  return { url: liveUrl, method: 'cloudflare-pages' }
}

export async function buildAndPublishMobile(projectId, { platform, track, emitActivity, emitStatus }) {
  const project = await getProject(projectId)
  if (!project) throw new Error('Project not found')

  emitActivity({ id: `mobile-init`, type: 'build', message: `Preparing ${platform} build...`, status: 'running' })

  if (!process.env.CODEMAGIC_GIT_REPO_URL) {
    emitActivity({ id: `mobile-git`, type: 'build', message: 'Setting up build repository...', status: 'running' })

    await sandboxManager.runCommand(projectId, 'cd /home/user/project && git init', 5000)
    await sandboxManager.runCommand(projectId, 'cd /home/user/project && git add -A', 10000)
    await sandboxManager.runCommand(
      projectId,
      'cd /home/user/project && git -c user.name="MachineGun" -c user.email="agent@machinegun.dev" commit -m "Machine Gun build"',
      10000
    )

    if (process.env.CODEMAGIC_GIT_PUSH_URL) {
      await sandboxManager.runCommand(
        projectId,
        `cd /home/user/project && git remote add origin ${process.env.CODEMAGIC_GIT_PUSH_URL} 2>/dev/null || git remote set-url origin ${process.env.CODEMAGIC_GIT_PUSH_URL}`,
        5000
      )
      const pushResult = await sandboxManager.runCommand(
        projectId,
        'cd /home/user/project && git push -u origin main --force',
        30000
      )
      if (pushResult.exitCode !== 0) {
        emitActivity({ id: `mobile-git`, type: 'build', message: 'Failed to push code to build repo', status: 'error', update: true })
        throw new Error(`Git push failed: ${pushResult.stderr}`)
      }
    }

    emitActivity({ id: `mobile-git`, type: 'build', message: 'Code pushed to build repository', status: 'success', update: true })
  }

  if (!process.env.CODEMAGIC_API_TOKEN || !process.env.CODEMAGIC_APP_ID) {
    throw new Error(
      'Codemagic is not configured. Add CODEMAGIC_API_TOKEN and CODEMAGIC_APP_ID to enable mobile builds.'
    )
  }

  emitActivity({ id: `mobile-build`, type: 'build', message: `Building ${platform === 'android' ? 'AAB' : 'IPA'}...`, status: 'running' })

  const workflowMap = { android: 'android-release', ios: 'ios-release' }
  const workflowId = workflowMap[platform]

  const environment = track ? { variables: { PUBLISH_TRACK: track } } : {}

  const buildResponse = await codemagic.startBuild({
    appId: process.env.CODEMAGIC_APP_ID,
    workflowId,
    branch: 'main',
    environment,
  })

  emitStatus({ status: 'building', buildId: buildResponse.buildId, platform })
  updateProject(projectId, { status: 'building', currentBuildId: buildResponse.buildId })

  const result = await codemagic.pollBuildUntilDone(buildResponse.buildId, {
    intervalMs: 15000,
    timeoutMs: 1200000,
    onStatus({ status, artefacts }) {
      emitActivity({
        id: `mobile-build`,
        type: 'build',
        message: status === 'building'
          ? `Building ${platform === 'android' ? 'AAB' : 'IPA'}...`
          : status === 'finished'
            ? `${platform === 'android' ? 'AAB' : 'IPA'} built successfully`
            : `Build ${status}`,
        status: status === 'finished' ? 'success' : status === 'failed' ? 'error' : 'running',
        update: true,
      })
    },
  })

  if (result.status !== 'finished') {
    emitStatus({ status: 'error', platform })
    updateProject(projectId, { status: 'error' })
    throw new Error(`Build failed with status: ${result.status}`)
  }

  const artifactUrls = result.artefacts?.map((a) => a.url) || []

  if (track) {
    emitActivity({ id: `mobile-publish`, type: 'build', message: `Published to ${platform === 'android' ? 'Google Play' : 'App Store'} (${track})`, status: 'success' })
  }

  emitStatus({ status: 'success', platform, artifacts: artifactUrls })
  updateProject(projectId, { status: 'success' })

  return {
    status: 'success',
    platform,
    artifacts: artifactUrls,
    buildId: buildResponse.buildId,
  }
}
