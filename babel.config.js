module.exports = {
  "presets": [
    [
      "env",
      {
        "targets": {
          "node": "current"
        }
      }
    ]
  ],
  "plugins": [
    [
      "transform-react-jsx",
      {
        "pragma": "h"
      }
    ]
  ]
}
