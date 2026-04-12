const CODEMAGIC_API = 'https://api.codemagic.io'

function getHeaders() {
  const token = process.env.CODEMAGIC_API_TOKEN
  if (!token) throw new Error('CODEMAGIC_API_TOKEN is not configured')
  return {
    'Content-Type': 'application/json',
    'x-auth-token': token,
  }
}

export async function listApps() {
  const res = await fetch(`${CODEMAGIC_API}/apps`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`Codemagic API error: ${res.status}`)
  const data = await res.json()
  return data.applications || []
}

export async function getApp(appId) {
  const res = await fetch(`${CODEMAGIC_API}/apps/${appId}`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`Codemagic API error: ${res.status}`)
  const data = await res.json()
  return data.application
}

export async function addApp(repositoryUrl) {
  const res = await fetch(`${CODEMAGIC_API}/apps`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ repositoryUrl }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to add app: ${err}`)
  }
  return res.json()
}

export async function startBuild({ appId, workflowId, branch = 'main', environment = {} }) {
  const body = {
    appId,
    workflowId,
    branch,
  }

  if (Object.keys(environment).length > 0) {
    body.environment = environment
  }

  const res = await fetch(`${CODEMAGIC_API}/builds`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to start build: ${err}`)
  }

  return res.json()
}

export async function cancelBuild(buildId) {
  const res = await fetch(`${CODEMAGIC_API}/builds/${buildId}/cancel`, {
    method: 'POST',
    headers: getHeaders(),
  })
  return { cancelled: res.ok, status: res.status }
}

export async function getBuildStatus(buildId) {
  const res = await fetch(`${CODEMAGIC_API}/builds/${buildId}`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`Failed to get build status: ${res.status}`)
  return res.json()
}

export async function pollBuildUntilDone(buildId, { onStatus, intervalMs = 10000, timeoutMs = 600000 } = {}) {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    const data = await getBuildStatus(buildId)
    const build = data.build || data

    const status = build.status || 'unknown'

    if (onStatus) {
      onStatus({
        status,
        buildId,
        progress: build.progress,
        artefacts: build.artefacts,
      })
    }

    if (status === 'finished' || status === 'failed' || status === 'canceled' || status === 'cancelled') {
      return {
        status,
        artefacts: build.artefacts || [],
        buildId,
      }
    }

    await new Promise((r) => setTimeout(r, intervalMs))
  }

  throw new Error('Build timed out after ' + (timeoutMs / 1000) + ' seconds')
}

export function generateFlutterYaml({ appName, androidPublish = false, iosPublish = false, playStoreTrack = 'internal' }) {
  return `workflows:
  android-release:
    name: Android Release
    max_build_duration: 30
    instance_type: linux_x2
    environment:
      flutter: stable
      groups:
        - google_play_credentials
    scripts:
      - name: Get packages
        script: flutter pub get
      - name: Build AAB
        script: flutter build appbundle --release
    artifacts:
      - build/**/outputs/**/*.aab
    publishing:
${androidPublish ? `      google_play:
        credentials: $GCLOUD_SERVICE_ACCOUNT_CREDENTIALS
        track: ${playStoreTrack}
        submit_as_draft: true` : '      email:\n        recipients:\n          - user@example.com'}

  ios-release:
    name: iOS Release
    max_build_duration: 60
    instance_type: mac_mini_m2
    environment:
      flutter: stable
      groups:
        - app_store_credentials
      ios_signing:
        distribution_type: app_store
        bundle_identifier: com.devflow.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}
    scripts:
      - name: Get packages
        script: flutter pub get
      - name: Build IPA
        script: flutter build ipa --release --export-options-plist=/Users/builder/export_options.plist
    artifacts:
      - build/ios/ipa/*.ipa
    publishing:
${iosPublish ? `      app_store_connect:
        auth: integration
        submit_to_testflight: true` : '      email:\n        recipients:\n          - user@example.com'}

  web-release:
    name: Web Release
    max_build_duration: 15
    instance_type: linux_x2
    environment:
      flutter: stable
    scripts:
      - name: Get packages
        script: flutter pub get
      - name: Build Web
        script: flutter build web --release
    artifacts:
      - build/web/**
`
}

export function generateReactNativeYaml({ appName, androidPublish = false, iosPublish = false, playStoreTrack = 'internal' }) {
  return `workflows:
  android-release:
    name: Android Release
    max_build_duration: 30
    instance_type: linux_x2
    environment:
      node: 18
      groups:
        - google_play_credentials
    scripts:
      - name: Install dependencies
        script: npm install
      - name: Build Android
        script: |
          cd android
          ./gradlew assembleRelease
    artifacts:
      - android/app/build/outputs/**/*.apk
      - android/app/build/outputs/**/*.aab
    publishing:
${androidPublish ? `      google_play:
        credentials: $GCLOUD_SERVICE_ACCOUNT_CREDENTIALS
        track: ${playStoreTrack}
        submit_as_draft: true` : '      email:\n        recipients:\n          - user@example.com'}

  ios-release:
    name: iOS Release
    max_build_duration: 60
    instance_type: mac_mini_m2
    environment:
      node: 18
      groups:
        - app_store_credentials
      ios_signing:
        distribution_type: app_store
        bundle_identifier: com.devflow.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}
    scripts:
      - name: Install dependencies
        script: npm install
      - name: Install CocoaPods
        script: cd ios && pod install
      - name: Build IPA
        script: |
          xcodebuild -workspace ios/*.xcworkspace \\
            -scheme ${appName} \\
            -sdk iphoneos \\
            -configuration Release \\
            -archivePath build/${appName}.xcarchive \\
            archive
    artifacts:
      - build/ios/ipa/*.ipa
    publishing:
${iosPublish ? `      app_store_connect:
        auth: integration
        submit_to_testflight: true` : '      email:\n        recipients:\n          - user@example.com'}
`
}
