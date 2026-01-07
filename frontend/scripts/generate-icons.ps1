Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location -Path "$PSScriptRoot/.."

Add-Type -AssemblyName System.Drawing

function New-Icon {
  param (
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [int]$Size
  )

  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $graphics = [System.Drawing.Graphics]::FromImage($bmp)
  $graphics.SmoothingMode = "AntiAlias"

  $background = [System.Drawing.Color]::FromArgb(0xFF, 0x1A, 0x36, 0x5D)
  $accent = [System.Drawing.Color]::FromArgb(0xFF, 0xFF, 0x7F, 0x50)

  $graphics.Clear($background)

  $fontSize = [int]($Size * 0.35)
  $font = New-Object System.Drawing.Font -ArgumentList @("Arial Black", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = "Center"
  $format.LineAlignment = "Center"

  $brush = New-Object System.Drawing.SolidBrush($accent)
  $graphics.DrawString("S", $font, $brush, (New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)), $format)

  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

  $brush.Dispose()
  $format.Dispose()
  $font.Dispose()
  $graphics.Dispose()
  $bmp.Dispose()
}

New-Icon -Path "public/icon-192.png" -Size 192
New-Icon -Path "public/icon-512.png" -Size 512
