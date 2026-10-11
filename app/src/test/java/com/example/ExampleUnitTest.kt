package com.example

import com.example.config.TemplateAppConfig
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ExampleUnitTest {

  @Test
  fun `sanitizeAssetPath normalizes paths and blocks path traversal`() {
    assertEquals(
      "web/index.html",
      TemplateAppConfig.sanitizeAssetPath("file:///android_asset/web/index.html"),
    )
    assertEquals(
      "web/index.html",
      TemplateAppConfig.sanitizeAssetPath("/web/./index.html"),
    )
    assertEquals(
      "etc/passwd",
      TemplateAppConfig.sanitizeAssetPath("../../etc/passwd"),
    )
    assertEquals(
      "web/sub/page.html",
      TemplateAppConfig.sanitizeAssetPath("web\\sub\\page.html"),
    )
  }

  @Test
  fun `isSafeLocalAssetUrl permits android_asset web files and rejects traversal`() {
    assertTrue(
      TemplateAppConfig.isSafeLocalAssetUrl("file:///android_asset/web/index.html"),
    )
    assertTrue(
      TemplateAppConfig.isSafeLocalAssetUrl("file:///android_asset/web/css/template.css?v=1#top"),
    )
    assertFalse(
      TemplateAppConfig.isSafeLocalAssetUrl("file:///android_asset/web/../../secret.txt"),
    )
    assertFalse(
      TemplateAppConfig.isSafeLocalAssetUrl("file:///data/data/com.example/shared_prefs/prefs.xml"),
    )
    assertFalse(
      TemplateAppConfig.isSafeLocalAssetUrl("https://example.com/index.html"),
    )
  }
}
