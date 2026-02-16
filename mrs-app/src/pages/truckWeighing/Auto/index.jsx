import { Container, Paper, Typography } from "@mui/material";

export default function TruckWeighingAuto() {
  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">
          บันทึกการชั่งน้ำหนัก
        </Typography>
      </Paper>
    </Container>
  );
}
