// frontend/src/components/ProjectHistory.jsx
import React, { useEffect, useState } from 'react';
import {
  Container, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Box, CircularProgress, Alert, Button, TablePagination
} from '@mui/material';
import { Visibility, Delete, Refresh, SupervisorAccount } from '@mui/icons-material';
import { projectService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function ProjectHistory({ onViewProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { currentUser, isAdmin } = useAuth();

  useEffect(() => {
    loadProjects();
  }, [currentUser, isAdmin]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      let targetUid = 'anonymous';

      if (isAdmin) {
        targetUid = 'all';
      } else if (currentUser) {
        targetUid = currentUser.uid;
      }

      console.log(`Carregando projetos. Modo Admin: ${isAdmin}. Target: ${targetUid}`);

      const response = await projectService.listProjects(targetUid);

      // O serviço retorna { success: true, data: [...] }
      const list = (response && Array.isArray(response.data)) ? response.data : [];
      setProjects(list);
    } catch (error) {
      console.error("Erro ao carregar histórico", error);
      setError("Não foi possível carregar o histórico.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este projeto?')) {
      try {
        await projectService.deleteProject(id);
        setProjects(projects.filter(p => p.id !== id));
      } catch (err) {
        alert("Erro ao excluir projeto.");
      }
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="lg">
      {/* CABEÇALHO RESPONSIVO CORRIGIDO */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' }, // Coluna no celular, Linha no PC
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' }, // Alinhamento
          mb: 3,
          gap: 2 // Espaço entre os elementos
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            Histórico
          </Typography>
          {/* O Chip agora fica embaixo do título no mobile se precisar */}
          {isAdmin && (
            <Chip
              icon={<SupervisorAccount />}
              label="Visão Admin"
              color="secondary"
              size="small"
              variant="outlined"
              sx={{ mt: 0.5 }}
            />
          )}
        </Box>

        {/* Botão Atualizar agora tem largura total no mobile para facilitar o toque */}
        <Button
          startIcon={<Refresh />}
          onClick={loadProjects}
          variant="outlined"
          size="small"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Atualizar Lista
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>Projeto</strong></TableCell>
                <TableCell><strong>Data</strong></TableCell>
                <TableCell><strong>Complexidade</strong></TableCell>
                <TableCell><strong>Investimento</strong></TableCell>
                <TableCell><strong>ROI (Ano 1)</strong></TableCell>
                <TableCell align="center"><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.length > 0 ? (
                projects
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((project) => (
                    <TableRow key={project.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{project.project_name}</Typography>
                        {isAdmin && project.owner_uid !== currentUser?.uid && (
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            ID: {project.owner_uid.slice(0, 8)}...
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={project.complexity_score?.classification || 'N/A'}
                          color={project.complexity_score?.classification === 'HIGH' ? 'error' : project.complexity_score?.classification === 'MEDIUM' ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(project.results?.development_cost || 0)}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: project.results?.roi_year_1 > 0 ? 'green' : 'red' }}>
                        {project.results?.roi_year_1?.toFixed(1)}%
                      </TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => onViewProject(project)}>
                          <Visibility />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(project.id)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      Nenhuma simulação encontrada.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={projects.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página:"
          />
        </TableContainer>
      )}
    </Container>
  );
}