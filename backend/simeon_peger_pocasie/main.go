// main.go
package main

/**
 * login: admin@admin.com
 * password: oNyOuGHtHS
 */

import (
	"log"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
)

var (
	app = pocketbase.New()
)

func main() {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {

		e.Router.POST("/api/upload", func(c echo.Context) error {
			data := echo.Map{}

			if err := c.Bind(&data); err != nil {
				return c.JSON(400, echo.Map{
					"ok":    false,
					"error": err.Error(),
				})
			}

			devices_table, err := app.Dao().FindCollectionByNameOrId("devices")
			if err != nil {
				return c.JSON(500, echo.Map{
					"ok":    false,
					"error": err.Error(),
				})
			}

			device := models.Record{}
			err = app.Dao().RecordQuery(devices_table).AndWhere(&dbx.HashExp{"token": data["token"].(string)}).One(&device)

			if err != nil {
				return c.JSON(500, echo.Map{
					"ok":    false,
					"error": err.Error(),
				})
			}

			measurements_table, err := app.Dao().FindCollectionByNameOrId("measurements")
			if err != nil {
				return c.JSON(500, echo.Map{
					"ok":    false,
					"error": err.Error(),
				})
			}

			sensor_data := data["sensor_data"].(map[string]interface{})

			measurement_record := *models.NewRecord(measurements_table)
			measurement_record.Set("device", device.Get("id"))
			measurement_record.Set("temperature", sensor_data["temperature"].(float64))
			measurement_record.Set("humidity", sensor_data["humidity"].(float64))
			measurement_record.Set("pressure", sensor_data["pressure"].(float64))
			measurement_record.Set("light", sensor_data["light"].(float64))

			if err = app.Dao().SaveRecord(&measurement_record); err != nil {
				return c.JSON(500, echo.Map{
					"ok":    false,
					"error": err.Error(),
				})
			}

			return c.JSON(200, echo.Map{
				"ok": true,
			})
		})

		return nil
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
